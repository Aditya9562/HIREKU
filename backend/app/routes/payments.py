from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import uuid
from typing import Dict, Any

from app.config import settings
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Resume, Transaction, AuditLog
from app.schemas import CheckoutRequest, CheckoutResponse, WebhookResponse
from app.services.payments import midtrans_service

router = APIRouter(prefix="/payments", tags=["Payments"])

PREMIUM_PRICE = 19900.00 # Rp19.900 default price

@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initiate a transaction and retrieve a Snap token/URL from Midtrans"""
    # Verify resume belongs to user
    resume = db.query(Resume).filter(
        Resume.id == payload.resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied."
        )

    # Generate a unique order ID
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    try:
        # Call Midtrans Snap service
        midtrans_data = midtrans_service.create_checkout_session(
            order_id=order_id,
            amount=PREMIUM_PRICE,
            email=current_user.email
        )
        
        # Save pending transaction to DB
        transaction = Transaction(
            order_id=order_id,
            user_id=current_user.id,
            resume_id=resume.id,
            amount=PREMIUM_PRICE,
            status="pending",
            snap_token=midtrans_data["snap_token"]
        )
        db.add(transaction)
        
        # Audit Log
        audit = AuditLog(
            user_id=current_user.id,
            action="CREATE_PAYMENT",
            ip_address=current_user.ip_address,
            details={"order_id": order_id, "amount": PREMIUM_PRICE}
        )
        db.add(audit)
        
        db.commit()
        
        return CheckoutResponse(
            order_id=order_id,
            amount=PREMIUM_PRICE,
            snap_token=midtrans_data["snap_token"],
            redirect_url=midtrans_data["redirect_url"]
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate payment token: {str(e)}"
        )

@router.post("/webhook", response_model=WebhookResponse)
async def midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    """Callback notification endpoint from Midtrans. Safe signature check applied."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
        
    order_id = payload.get("order_id")
    transaction_status = payload.get("transaction_status")
    signature_key = payload.get("signature_key")
    gross_amount = payload.get("gross_amount")
    payment_type = payload.get("payment_type")
    transaction_id = payload.get("transaction_id")
    
    if not all([order_id, transaction_status, signature_key, gross_amount]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields in callback notification"
        )

    # Verify signature key authenticity
    is_valid = midtrans_service.verify_webhook_signature(
        order_id=order_id,
        status_code=payload.get("status_code", ""),
        gross_amount=gross_amount,
        signature_key=signature_key
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Signature key validation failed"
        )
        
    # Retrieve transaction from DB
    transaction = db.query(Transaction).filter(Transaction.order_id == order_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction order not found"
        )

    try:
        # Standard Midtrans status mapping
        # settlement -> paid (success)
        # capture -> paid (for credit cards)
        # pending -> unpaid
        # deny, cancel, expire -> failed/cancelled
        status_mapping = {
            "settlement": "settlement",
            "capture": "settlement",
            "pending": "pending",
            "deny": "deny",
            "cancel": "cancel",
            "expire": "expire"
        }
        
        db_status = status_mapping.get(transaction_status, "pending")
        
        transaction.status = db_status
        transaction.payment_type = payment_type
        transaction.transaction_id = transaction_id
        transaction.raw_response = payload
        
        # Add Audit log
        audit = AuditLog(
            user_id=transaction.user_id,
            action=f"PAYMENT_WEBHOOK_{db_status.upper()}",
            details={"order_id": order_id, "status": transaction_status}
        )
        db.add(audit)
        
        db.commit()
        return WebhookResponse(status="success", message="Payment status updated successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database update failed: {str(e)}"
        )
        
@router.post("/simulate-success/{order_id}")
def simulate_success(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Development API to simulate a successful payment trigger without loading the webhook tunnel"""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint only available in development debug mode."
        )
        
    transaction = db.query(Transaction).filter(
        Transaction.order_id == order_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction order not found."
        )
        
    transaction.status = "settlement"
    transaction.payment_type = "gopay_mock"
    transaction.transaction_id = "mock-midtrans-trans-id-999"
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="PAYMENT_SIMULATED_SUCCESS",
        ip_address=current_user.ip_address,
        details={"order_id": order_id}
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "message": "Transaction mock paid successfully!"}
