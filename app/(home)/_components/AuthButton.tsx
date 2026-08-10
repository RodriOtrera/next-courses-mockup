// "use client";
// import { Button } from "@/components/ui/button";
// import { Session } from "next-auth";
// import React, { useState } from "react";
// import { signIn, signOut } from "next-auth/react";

// interface AuthButtonProps {
//   session: Session | null;
// }

// const AuthButton: React.FC<AuthButtonProps> = ({ session }) => {
//   const [loading, setLoading] = useState(false);

//   if (session == null) {
//     return (
//       <Button
//         onClick={async () => {
//           setLoading(true);
//           await signIn("google");
//           setLoading(false);
//         }}
//       >
//         Sign In
//       </Button>
//     );
//   }

//   return (
//     <Button
//       disabled={loading}
//       onClick={async () => {
//         setLoading(true);
//         await signOut();
//         setLoading(false);
//       }}
//     >
//       Sign Out
//     </Button>
//   );
// };

// export default AuthButton;
