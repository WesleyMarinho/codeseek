// backend/config/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    // Determina o diretório baseado no tipo de arquivo
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(__dirname, '../uploads/products/images');
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(__dirname, '../uploads/products/videos');
    } else if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      uploadPath = path.join(__dirname, '../uploads/products/files');
    } else {
      return cb(new Error('Tipo de arquivo não suportado'), false);
    }

    // Cria o diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gera um nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  // Tipos de arquivo permitidos
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const allowedZipTypes = ['application/zip', 'application/x-zip-compressed'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype) || allowedZipTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use apenas imagens (JPEG, PNG, GIF, WebP), vídeos (MP4, WebM, OGG) ou ZIP.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo
    files: 10 // Máximo 10 arquivos por upload
  }
});

// Middleware para tratamento de erros de upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 100MB'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Muitos arquivos. Máximo: 10 arquivos'
      });
    }
  }
  
  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  logger.error('Upload error:', err);
  return res.status(500).json({
    success: false,
    message: 'Erro interno no upload'
  });
};

// Diretório base de uploads
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Resolve o caminho absoluto de um arquivo de upload a partir de:
// - um caminho absoluto existente,
// - um caminho relativo (com ou sem prefixo /uploads),
// - ou apenas o nome do arquivo (buscando em subpastas conhecidas)
function resolveUploadFullPath(fileSpecifier) {
  if (!fileSpecifier) return null;

  // Se veio como objeto (defensive), tentar extrair string
  const spec = String(fileSpecifier);

  // Já é absoluto e existe?
  if (path.isAbsolute(spec) && fs.existsSync(spec)) return spec;

  // Normalizar separadores para análise
  let normalized = spec.replace(/\\/g, '/');

  // Remover prefixo /uploads se presente
  if (normalized.startsWith('/uploads/')) {
    normalized = normalized.slice('/uploads/'.length);
  } else if (normalized === '/uploads') {
    normalized = '';
  }

  // Se contém uma barra, tratar como caminho relativo dentro de uploads
  if (normalized.includes('/')) {
    // Remover barra inicial
    normalized = normalized.replace(/^\/+/, '');
    const fullPath = path.join(UPLOADS_DIR, normalized);
    return fullPath;
  }

  // Caso contrário, é apenas o nome do arquivo: procurar nas subpastas
  const baseName = path.basename(normalized);
  const possibleSubdirs = ['products/images', 'products/files', 'products/videos'];
  for (const sub of possibleSubdirs) {
    const candidate = path.join(UPLOADS_DIR, sub, baseName);
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(UPLOADS_DIR, baseName); // última tentativa (raiz de uploads)
}

// Função para deletar arquivo (tolerante a SO e formatos de path)
const deleteFile = (fileSpecifier) => {
  try {
    const fullPath = resolveUploadFullPath(fileSpecifier);
    const exists = fullPath && fs.existsSync(fullPath);
    logger.info('Deleting file attempt', { input: fileSpecifier, fullPath, exists });

    if (exists) { 
      fs.unlinkSync(fullPath);
      logger.info('File deleted successfully', { fullPath });
      return true;
    }
    logger.warn('File not found for deletion', { input: fileSpecifier, resolved: fullPath });
    return false;
  } catch (error) {
    logger.error('Error deleting file', { input: fileSpecifier, error: error.message });
    return false;
  }
};

// Função para organizar informações de mídia
const organizeMediaInfo = (files) => {
  const mediaFiles = [];
  
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      // Criar o path relativo correto para ser servido via /uploads
      const relativePath = file.path.replace(path.join(__dirname, '../uploads'), '').replace(/\\/g, '/');
      // Garantir que o path comece com /
      const cleanPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      
      const mediaInfo = {
        id: `media_${Date.now()}_${index}`,
        originalName: file.originalname,
        filename: file.filename,
        path: cleanPath, // Path relativo para ser acessado via /uploads
        fullPath: file.path, // Path absoluto para operações de sistema
        mimetype: file.mimetype,
        size: file.size,
        type: file.mimetype.startsWith('image/') ? 'image' : (file.mimetype.startsWith('video/') ? 'video' : (file.mimetype.includes('zip') ? 'zip' : 'other')),
        uploadedAt: new Date().toISOString()
      };
      
      mediaFiles.push(mediaInfo);
    });
  }
  
  return mediaFiles;
};

module.exports = {
  upload,
  handleUploadError,
  deleteFile,
  organizeMediaInfo
};
