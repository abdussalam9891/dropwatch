// "use client";

// import { signOut } from "@/app/actions";
// import { Button } from "@/components/ui/button";
// import { LogIn, LogOut } from "lucide-react";
// import { useState } from "react";
// import AuthModal from "./AuthModal";

// export default function AuthButton({ user }) {
//   const [showAuthModal, setShowAuthModal] = useState(false);

//   if (user) {
//     return (
//       <form action={signOut}>
//         <Button variant="ghost" size="sm" type="submit" className="gap-2">
//           <LogOut className="w-4 h-4" />
//           Sign Out
//         </Button>
//       </form>
//     );
//   }

//   return (
//     <>
//       <Button
//         onClick={() => setShowAuthModal(true)}
//         variant="default"
//         size="sm"
//         className="bg-orange-500 hover:bg-orange-600 gap-2"
//       >
//         <LogIn className="w-4 h-4" />
//         Sign In
//       </Button>

//       <AuthModal
//         isOpen={showAuthModal}
//         onClose={() => setShowAuthModal(false)}
//       />
//     </>
//   );
// }



"use client";

import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import AuthModal from "./AuthModal";
import type { AuthUser } from "@supabase/supabase-js";

interface AuthButtonProps {
  user: AuthUser | null;
}

export default function AuthButton({ user }: AuthButtonProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          await signOut();
        }}
        className="gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50
          transition-all duration-200 group"
      >
        {signingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        )}
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowAuthModal(true)}
        size="sm"
        className="gap-2 bg-orange-500 text-white
          hover:bg-orange-600 hover:-translate-y-0.5
          hover:shadow-lg hover:shadow-orange-200
          active:translate-y-0 active:shadow-none
          transition-all duration-200 group"
      >
        <LogIn className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Sign in
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
