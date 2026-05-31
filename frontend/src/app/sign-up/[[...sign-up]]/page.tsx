import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="w-full flex-grow flex items-center justify-center py-20 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 blur-xl pointer-events-none"></div>
        <SignUp 
          appearance={{
            elements: {
              card: "glass border border-white/10 shadow-2xl rounded-2xl bg-card/65",
              headerTitle: "text-white font-outfit font-bold",
              headerSubtitle: "text-gray-400 text-sm",
              socialButtonsBlockButton: "border border-white/5 bg-white/5 hover:bg-white/10 text-white transition",
              formButtonPrimary: "bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-glow transition",
              footerActionLink: "text-primary-400 hover:text-primary-300",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-white/5 border border-white/10 text-white focus:border-primary-500 transition",
              dividerLine: "bg-white/10",
              dividerText: "text-gray-400"
            }
          }}
        />
      </div>
    </div>
  );
}
