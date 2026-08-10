import nodemailer from 'nodemailer';



const SMTP_SERVER_HOST = process.env.SMTP_SERVER_HOST;
const SMTP_SERVER_USERNAME = process.env.SMTP_SERVER_USERNAME;
const SMTP_SERVER_PASSWORD = process.env.SMTP_SERVER_PASSWORD;
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: SMTP_SERVER_HOST,
    port: 587,
    secure: true,
    auth: {
        user: SMTP_SERVER_USERNAME,
        pass: SMTP_SERVER_PASSWORD,
    },
    from: process.env.SMTP_SERVER_USERNAME!,
});

export async function sendMail({
    sendTo,
    subject,
    text,
    html,
    img_url,
}: {
    sendTo?: string | string[];
    subject: string;
    text: string;
    html?: string;
    img_url?: string;
}) {
    try {
        const isVerified = await transporter.verify();
    } catch (error) {
        console.error('Something Went Wrong', SMTP_SERVER_USERNAME, SMTP_SERVER_PASSWORD, error);
        return;
    }
    const info = await transporter.sendMail({
        from: process.env.SMTP_SERVER_USERNAME!,
        to: sendTo,
        subject: subject,
        text: text,

        html: html ?? `
       <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Poly:ital@0;1&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    <title>${subject}</title>
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
            margin: 0 auto;
        }
        
        /* Main styles */
        body {
            color: white;
            margin: 0;
            padding: 0;
            background-color: black;
            font-family: "Montserrat", sans-serif;
        }
        
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: black;
        }
        
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        
        .button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #ec4e39;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s ease;
        }
        
        .button:hover {
            background-color: #f9533d;
        }
        
        /* Fallback for Outlook */
        .button-table {
            width: 100%;
            color: white;
        }
        
        .button-cell {
            text-align: center;
            padding: 10px 0;
            color: white;
        }
        
        h1 {
            color: white;
            font-size: 24px;
            margin-bottom: 20px;
        }
        
        p {
            color: #808080;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        
        img {
            border-radius: 16px;
            object-fit: cover;
        }

    </style>
</head>
<body>
    <!-- Outer table for email client compatibility -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px 0;">
                
                <!-- Main email container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container">
                    <tr>
                        <td class="content">

                        <img
                        src="https://xvgfdttoun.ufs.sh/f/bcAmghSQ9AflFrNEKgHm7XQfSVgE6x3LBiMtTUKD5CjuWlZn"
                        width="100"
                        height="100"
                        alt="AXELDUBIN logo"
                        />

                            <p style="color: #707070;">AXELDUBIN - WEB</p>

                            <h1>${subject}</h1>
                            
                            <p style="text-align: start; white-space: pre-wrap;">${text}</p>

                            ${img_url ? `<img src="${img_url}" alt="Imagen" width="300" height="140" />` : ''}
                            
                            <!-- Button using table method for maximum compatibility -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="button-table">
                                   <tr>
                                    <td class="button-cell">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://axeldubin.com/productos" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#ec4e39">
                                            <w:anchorlock/>
                                            <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Segui con todo!</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <a href="https://axeldubin.com/productos" class="button">
                                        <span style="color: white; padding: 0; margin: 0;">Segui con todo!</span>
                                        </a>
                                        <!--<![endif]-->
                                    </td>
                                </tr>
                            </table>
                            
                            <p>Si tenes alguna pregunta, no dudes en ponerte en contacto</p>
                            
                            <p style="font-style: italic;">Las excusas y los limites son ilusiones del ego,<br />Axel Dubin</p>
                            
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
       `
        // html: html ? html : '',
    });
    console.log('Message Sent', info.messageId);
    return info;
}


export async function sendMailCourseProgress({
    sendTo,
    course_title,
    course_completion
}: {
    sendTo?: string | string[];
    course_title: string;

    course_completion: PercentageCourseCompletion
}) {
    try {
        const isVerified = await transporter.verify();
    } catch (error) {
        console.error('Something Went Wrong', SMTP_SERVER_USERNAME, SMTP_SERVER_PASSWORD, error);
        return;
    }
    const info = await transporter.sendMail({
        from: process.env.SMTP_SERVER_USERNAME!,
        to: sendTo,
        subject: getSubjectForPercentage(course_completion, course_title),
        text: "",

        html: `
       <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
        }
        
        /* Main styles */
        body {
            color: white;
            margin: 0;
            padding: 0;
            background-color: black;
            font-family: "Montserrat", sans-serif;
        }
        
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: black;
        }
        
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        
        .button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #ec4e39;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s ease;
        }
        
        .button:hover {
            background-color: #f9533d;
        }
        
        /* Fallback for Outlook */
        .button-table {
            width: 100%;
            color: white;
        }
        
        .button-cell {
            text-align: center;
            padding: 10px 0;
            color: white;
        }
        
        h1 {
            color: white;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        p {
            color: #808080;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <!-- Outer table for email client compatibility -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px 0;">
                
                <!-- Main email container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container">
                    <tr>
                        <td class="content">

                        <img
                        src="https://xvgfdttoun.ufs.sh/f/bcAmghSQ9AflFrNEKgHm7XQfSVgE6x3LBiMtTUKD5CjuWlZn"
                        width="120"
                        height="120"
                        alt="AXELDUBIN logo"
                        style="object-fit: cover;"
                        />

                            <p style="color: #707070;">AXELDUBIN - WEB</p>

                            <h1 style="font-weight: 900; color: white; font-size: 24px;">
                            FELICITACION POR COMPLETAR UN
                            </h1>
                            <h1 style="color: #ec4e39; font-size: 40px; margin-bottom: 20px; font-weight: 900;">
                            ${course_completion}%</h1>
                            <h1 style="font-size: 24px;">CURSO DE INSTRUCTOR DE CALISTENIA</h1>

                            <p style="color: #909090; font-size: 16px; font-style: italic;">
                            ${getFraseForPercentage(course_completion)}</p>
                            
                            <!-- Button using table method for maximum compatibility -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="button-table">
                                   <tr>
                                    <td class="button-cell">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://axeldubin.com" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#ec4e39">
                                            <w:anchorlock/>
                                            <center style="color:#ffffff;font-family:Montserrat, sans-serif;font-size:16px;font-weight:bold;">Click aqui</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <a href="https://axeldubin.com" class="button">
                                        <span style="color: white; padding: 0; margin: 0;">Click aqui</span>
                                        </a>
                                        <!--<![endif]-->
                                    </td>
                                </tr>
                            </table>
                            
                            <p>Si tenes alguna pregunta, no dudes en ponerte en contacto</p>
                            
                            <p>Las excusas y los limites son ilusiones del ego,<br>Axel Dubin</p>
                            
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
       `
        // html: html ? html : '',
    });
    console.log('Message Sent', info.messageId);
    return info;
}

type PercentageCourseCompletion = 25 | 50 | 75;

function getFraseForPercentage(percentage: PercentageCourseCompletion) {
    switch (percentage) {
        case 25:
            return "¡Felicidades! Recuerda que los conocimientos son el primer paso hacia los resultados que pocos alcanzan. Y no olvides lo más importante, aplicar cada día lo aprendido. ¡A seguir así!";
        case 50:
            return "¡Ya estás a mitad de camino!. En este punto los perdedores abandona, pero los ganadores entienden que son los únicos responsables de lograr grandes resultados en la vida. ¿Serás un ganador o un perdedor? ";
        case 75:
            return "¡Es el último esfuerzo!. Ya estás muy cerca de recibirte como instructor. Ahora decides si ser tu mejor versión y darlo todo, o dejar pasar la oportunidad de crecimiento. Y yo quiero que ganes en la Calistenia y en la vida. ¡NO TE RINDAS!";
        default:
            return "75%";
    }
}

function getSubjectForPercentage(percentage: PercentageCourseCompletion, course_title: string) {
    switch (percentage) {
        case 25:
            return `${course_title}, ya completaste el 25%!`;
        case 50:
            return `${course_title}, ya completaste el 50%!`;
        case 75:
            return `${course_title}, ya completaste el 75%!`;
        default:
            return "75%";
    }
}