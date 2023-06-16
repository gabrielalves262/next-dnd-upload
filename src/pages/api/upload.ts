import multer from 'multer';
import { PageConfig } from 'next';
import { v4 } from 'uuid';

export default async function handler(req: any, res: any) {
    try {
        const storage = multer.diskStorage({
            destination: 'uploads/',
            filename: (req, file, cb) => {
                const originalName = file.originalname;
                const fileExtension = originalName.split('.').pop();
                const fileName = `${v4()}.${fileExtension}`;
                cb(null, fileName);
            },
        });

        const upload = multer({ storage });

        upload.array('files')(req, res, (err) => {
            if (err) {
                // Trate os erros de upload, se houver
                console.error(err);
                return res.status(500).json({ error: 'Erro ao fazer upload do arquivo.', stracktrace: err });
            }
            return res.status(200).json({ message: 'Upload do arquivo concluído com sucesso.' });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao fazer upload do arquivo.', stracktrace: error });
    }
}

export const config: PageConfig = {
    api: {
        bodyParser: false,
    },
};