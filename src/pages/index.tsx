import { faTimesCircle, faCheckCircle } from "@fortawesome/free-regular-svg-icons";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios, { CancelTokenSource } from "axios";
import Head from "next/head";
import { createRef, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";


interface iFilesListItem {
    id: string,
    file: Blob,
    isValid: boolean
}

export default function Page() {
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => handleDrop(acceptedFiles),
        onDragEnter: (e) => handleDrag(e, true),
        onDragLeave: (e) => handleDrag(e, false)
    })

    const [state, setState] = useState<'uploading' | 'success' | 'error' | 'canceled'>()
    const [progress, setProgress] = useState<number>()
    const [cancelToken, setCancelToken] = useState<CancelTokenSource>()
    const [dragIn, setDragIn] = useState(false)
    const [files, setFiles] = useState<iFilesListItem[]>([])

    const refInputFiles = createRef<HTMLInputElement>()

    const handleDrag = (e: React.DragEvent<HTMLElement>, state: boolean) => {
        e.preventDefault()
        e.stopPropagation()
        setDragIn(state)
    }

    const handleDrop = (newFiles: Blob[]) => {
        setDragIn(false)
        const _pushFiles: iFilesListItem[] = newFiles.map(file => ({ id: v4(), file, isValid: true }) as iFilesListItem)
        const _nFiles = [...files, ..._pushFiles]
        setFiles(_nFiles)
    }

    const handleRemove = (id: string) => {
        const _nFiles = [...files]
        const _fIndex = _nFiles.findIndex(f => f.id === id)
        if (_fIndex < 0) return
        _nFiles.splice(_fIndex, 1)
        setFiles(_nFiles)
    }


    const handleUpload = async () => {
        setState('uploading')
        setProgress(0)

        if (!files) return
        const formData = new FormData();
        files.forEach(({ file }) => formData.append('files', file))

        const cancelSource = axios.CancelToken.source()
        setCancelToken(cancelSource)

        try {
            const response = await axios.post('/api/upload', formData, {
                cancelToken: cancelSource.token,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const _progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
                    setProgress(_progress)
                },
            });

            if (response.status === 200) {
                setTimeout(() => setState('success'), 2000)
            } else {
                setState('error')
            }
        } catch (error) {
            if (axios.isCancel(error))
                setState('canceled')
            else
                setState('error')
        } finally {
            setCancelToken(undefined)
        }
    }

    const handleCancelUpload = () => {
        if (cancelToken) {
            console.log(cancelToken)
            cancelToken.cancel('Upload cancelado pelo usuário.')
        }
    }

    useEffect(() => {
        console.log(cancelToken)
    }, [cancelToken])


    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (state === 'uploading') {
                e.preventDefault();
                e.returnValue = 'Você tem um upload em progresso. Tem certeza de que deseja sair desta página?';
                console.log(e)
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [state])


    return (
        <main className="flex flex-col items-center py-16 w-full min-h-screen bg-gray-950">
            <Head>
                <title>Upload Files v2</title>
            </Head>

            {state === 'uploading' ? (
                <div className="flex flex-col items-center">
                    <div>Enviando...</div>
                    <div className="w-full">
                        <div className="flex w-80 h-3 bg-gray-900 mt-4">
                            <div className="bg-sky-500 flex h-full transition-all" style={{ width: `${progress ? progress : 0}%` }}></div>
                        </div>
                        <span className="flex w-full justify-end min-w-max transition-all" style={{ maxWidth: `${progress ? progress : 0}%` }}>{progress ?? 0}%</span>
                    </div>
                    {progress && progress < 95 ? <button onClick={handleCancelUpload} className="text-red-400">Cancelar</button> : false}
                </div>
            ) : state === "success" ? (
                <div className=" flex flex-col items-center">
                    <FontAwesomeIcon icon={faCheckCircle} className="w-10 h-10 text-emerald-400" />
                    <div className="my-6">Arquivos enviado com sucesso!</div>
                    <button className="text-sky-500" onClick={() => {
                        setFiles([])
                        setState(undefined)
                    }}>Voltar</button>
                </div>
            ) : state === 'error' ? (
                <div className=" flex flex-col items-center">
                    <FontAwesomeIcon icon={faTimesCircle} className="w-10 h-10 text-red-400" />
                    <div className="my-6">Ocorreu um erro ao enviar os arquivos!</div>
                    <button className="text-sky-500" onClick={() => {
                        setFiles([])
                        setState(undefined)
                    }}>Tentar Novamente</button>
                </div>
            ) : state === 'canceled' ? (
                <div className=" flex flex-col items-center">
                    <FontAwesomeIcon icon={faTimesCircle} className="w-10 h-10 text-red-400" />
                    <div className="my-6">Upload cancelado!</div>
                    <button className="text-sky-500" onClick={() => {
                        setFiles([])
                        setState(undefined)
                    }}>Tentar Novamente</button>
                </div>
            ) : (
                <>
                    <div {...getRootProps()} className={`flex flex-col items-center justify-center outline-4 outline-dashed outline-offset-2 outline-gray-700 w-80 h-48 rounded-2xl ${dragIn ? 'bg-gray-900' : 'bg-transparent'}`}>
                        <FontAwesomeIcon icon={faCloudArrowUp} className="w-8 h-8 text-sky-500" />
                        <div className="text-center text-sm mt-2">
                            <button onClick={() => refInputFiles.current?.click()} className="text-sky-400 mr-1">Escolha os arquivos</button>
                            ou arraste-os para cá
                        </div>

                        <input ref={refInputFiles} {...getInputProps()} className="hidden" type="file" multiple />
                    </div>

                    <div className="flex flex-col w-full max-w-lg bg-gray-900 divide-y divide-gray-950 mt-6">
                        {files.map(item => (
                            <div key={item.id} className="w-full p-4 flex gap-4">
                                <div className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap">{item.file.name}</div>
                                <div className="min-w-[80px] w-20 text-end">{converterBytes(item.file.size)}</div>
                                <button onClick={() => handleRemove(item.id)} className="text-red-400">
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {files.length > 0 ? <button onClick={handleUpload} className="py-2 px-10 bg-sky-500 hover:bg-sky-600 mt-6">Enviar</button> : false}
                </>
            )}
        </main>
    )
}



function converterBytes(bytes: number): string {
    const kilobyte = 1024;
    const megabyte = kilobyte * 1024;
    const gigabyte = megabyte * 1024;

    if (bytes < kilobyte) {
        return bytes + " bytes";
    } else if (bytes < megabyte) {
        return (bytes / kilobyte).toFixed(2) + " KB";
    } else if (bytes < gigabyte) {
        return (bytes / megabyte).toFixed(2) + " MB";
    } else {
        return (bytes / gigabyte).toFixed(2) + " GB";
    }
}