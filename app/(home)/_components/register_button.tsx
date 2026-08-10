// "use client";

// import React, { useState } from 'react'
// import { Session } from 'next-auth/types';
// import { Button } from '@/components/ui/button';
// import { signIn } from 'next-auth/react';
// import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

// const RegisterButton = ({data} : {data: Session}) => {
//     const [dialogOpen, setDialogOpen] = useState(false);

    
//   return (
//     <div>  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//     <DialogTrigger
//       onClick={() => {
//         setDialogOpen(true);
//       }}
//     >
//       {data == null ? (
//         <h1 className="cursor-pointer tracking-wide text-[#999999] transition hover:text-white">
//           REGISTRARSE
//         </h1>
//       ) : (
//         <></>
//       )}
//     </DialogTrigger>
//     <DialogContent>
//       <h1 className="text-lg">Registro con google</h1>
//       <h2 className="text-sm text-gray-400">
//         Para crear una cuenta y poder comprar los productos, puedes
//         utlizar tu cuenta de Google. Todas tus compras se guardaran en la
//         cuenta.
//       </h2>
//       <div className="flex justify-end">
//         <Button
//           variant="outline"
//           onClick={() => {
//             setDialogOpen(false);
//           }}
//         >
//           Volver
//         </Button>
//         <Button
//           className="flex items-center rounded-md bg-gray-100 px-4 ml-2"
//           onClick={() => {
//             signIn("google");
//           }}
//         >
//           {/* <BsGoogle color="black" /> */}
//           <h1 className="text-sm pl-2 text-black">Acceder</h1>
//         </Button>
//       </div>
//     </DialogContent>
//   </Dialog></div>
//   )
// }

// export default RegisterButton