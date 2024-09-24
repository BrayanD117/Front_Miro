interface DriveFileFrameProps {
  fileId: string;
  fileName: string;
  width?: string;
  height?: string;
  maxHeight?: string;
  border?: string
}

export function DriveFileFrame(
  {fileId, width='100%', height='80vh', maxHeight='100%', border='none'}: DriveFileFrameProps
) {
  return (
    <iframe
      src={`https://drive.google.com/file/d/${fileId}/preview`}
      style={{width, height, maxHeight, border}}
    />
  )
}