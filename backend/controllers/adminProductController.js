// backend/controllers/adminProductController.js (VERSÃO FINAL E CORRIGIDA)

const { Product, Category } = require('../models');
const logger = require('../config/logger');
const { organizeMediaInfo, deleteFile } = require('../config/upload');

// Função auxiliar para calcular e validar preços
const calculateAndValidatePrices = (body) => {
  // 1. Validação: monthlyPrice é obrigatório e deve ser maior ou igual a zero (0 = produto gratuito)
  if (body.monthlyPrice === undefined || body.monthlyPrice === null || body.monthlyPrice === '' || parseFloat(body.monthlyPrice) < 0) {
    body.monthlyPrice = 0;
  }

  const monthlyPrice = parseFloat(body.monthlyPrice);

  // Converte inputs para números, tratando campos vazios como 0
  const annualPriceInput = body.annualPrice ? parseFloat(body.annualPrice) : 0;
  const oneTimePriceInput = body.price ? parseFloat(body.price) : 0;

  // 2. Cálculo Automático:
  // Se annualPrice não foi fornecido, calcula como 12x o preço mensal.
  const finalAnnualPrice = (annualPriceInput > 0) ? annualPriceInput : monthlyPrice * 12;

  // Se one-time price (price) não foi fornecido, calcula como 36x o preço mensal (equivalente a 3 anos).
  const finalOneTimePrice = (oneTimePriceInput > 0) ? oneTimePriceInput : monthlyPrice * 36;

  return {
    monthlyPrice,
    annualPrice: finalAnnualPrice,
    price: finalOneTimePrice
  };
};


const adminProductController = {
  // Listar todos os produtos
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.findAll({
        include: { model: Category, as: 'category', attributes: ['name'] },
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, products });
    } catch (error) {
      logger.error('Error fetching all products:', { error: error.message });
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  // Buscar um único produto por ID
  getProductById: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      res.json({ success: true, product });
    } catch (error) {
      logger.error(`Error fetching product by ID ${req.params.id}:`, { error: error.message });
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  // Criar um novo produto (CORRIGIDO)
  createProduct: async (req, res) => {
    try {
      const { featuredMedia, ...otherData } = req.body;

      // Processa os preços usando a função auxiliar
      const prices = calculateAndValidatePrices(otherData);

      const newMediaUploads = (req.files && req.files.media) ? organizeMediaInfo(req.files.media) : [];
      const newZipUpload = (req.files && req.files.downloadFile) ? organizeMediaInfo(req.files.downloadFile) : [];

      let finalFeaturedMedia = null;
      if (newMediaUploads.length > 0) {
        finalFeaturedMedia = newMediaUploads.find(m => m.path === featuredMedia)?.path || newMediaUploads[0].path;
      }

      const productData = {
        ...otherData,
        ...prices, // Adiciona os preços validados e calculados
        mediaFiles: newMediaUploads,
        featuredMedia: finalFeaturedMedia,
        downloadFile: newZipUpload.length > 0 ? newZipUpload[0].path : null
      };

      const newProduct = await Product.create(productData);
      res.status(201).json({ success: true, message: 'Product created successfully.', product: newProduct });
    } catch (error) {
      logger.error('Error creating product:', { error: error.message });
      // Se for um erro da nossa validação, retorna 400
      if (error.message.includes('Monthly price')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Server error while creating the product.' });
    }
  },

  // Atualizar um produto existente (CORRIGIDO)
  updateProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

      const { mediaFiles: mediaFilesJSON, downloadFile: downloadFileAction, ...updatePayload } = req.body;

      // Processa os preços usando a função auxiliar
      const prices = calculateAndValidatePrices(updatePayload);
      Object.assign(updatePayload, prices); // Mescla os preços no payload de atualização

      const currentMediaFiles = product.mediaFiles || [];
      let finalMediaObjects = mediaFilesJSON ? JSON.parse(mediaFilesJSON) : [];

      const newMediaUploads = (req.files && req.files.media) ? organizeMediaInfo(req.files.media) : [];
      const newZipUpload = (req.files && req.files.downloadFile) ? organizeMediaInfo(req.files.downloadFile) : [];

      finalMediaObjects.push(...newMediaUploads);

      const finalMediaPaths = finalMediaObjects.map(m => m.path);
      currentMediaFiles.forEach(currentMedia => {
        if (!finalMediaPaths.includes(currentMedia.path)) {
          deleteFile(currentMedia.path);
        }
      });
      updatePayload.mediaFiles = finalMediaObjects;

      if (updatePayload.featuredMedia && !finalMediaPaths.includes(updatePayload.featuredMedia)) {
        updatePayload.featuredMedia = finalMediaObjects.length > 0 ? finalMediaObjects[0].path : null;
      } else if (!updatePayload.featuredMedia && finalMediaObjects.length > 0) {
        updatePayload.featuredMedia = finalMediaObjects[0].path;
      } else if (finalMediaObjects.length === 0) {
        updatePayload.featuredMedia = null;
      }

      if (newZipUpload.length > 0) {
        if (product.downloadFile) deleteFile(product.downloadFile);
        updatePayload.downloadFile = newZipUpload[0].path;
      } else if (downloadFileAction === '' && product.downloadFile) {
        deleteFile(product.downloadFile);
        updatePayload.downloadFile = null;
      }

      await product.update(updatePayload);
      res.json({ success: true, message: 'Product updated successfully.' });
    } catch (error) {
      logger.error(`Error updating product ${req.params.id}:`, { error: error.message });
      // Se for um erro da nossa validação, retorna 400
      if (error.message.includes('Monthly price')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Server error while updating the product.' });
    }
  },

  // Deletar mídia específica de um produto
  deleteProductMedia: async (req, res) => {
    try {
      const { productId, mediaId } = req.params;
      const product = await Product.findByPk(productId);

      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

      const mediaFiles = product.mediaFiles || [];
      const mediaToDelete = mediaFiles.find(media => media.id === mediaId);

      if (!mediaToDelete) return res.status(404).json({ success: false, message: 'Media not found.' });

      deleteFile(mediaToDelete.path);

      const updatedMediaFiles = mediaFiles.filter(media => media.id !== mediaId);
      let updatedFeaturedMedia = product.featuredMedia;
      if (product.featuredMedia === mediaToDelete.path) {
        updatedFeaturedMedia = updatedMediaFiles.length > 0 ? updatedMediaFiles[0].path : null;
      }

      await product.update({ mediaFiles: updatedMediaFiles, featuredMedia: updatedFeaturedMedia });
      res.json({ success: true, message: 'Media deleted successfully.' });
    } catch (error) {
      logger.error(`Error deleting product media:`, { productId: req.params.productId, mediaId: req.params.mediaId, error: error.message });
      res.status(500).json({ success: false, message: 'Server error while deleting media.' });
    }
  },

  // Deletar o arquivo de download (ZIP) de um produto
  deleteProductDownloadFile: async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await Product.findByPk(productId);

      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      if (!product.downloadFile) return res.status(404).json({ success: false, message: 'Product does not have a download file.' });

      logger.info(`Deleting download file for product ${product.id}: ${product.downloadFile}`);
      deleteFile(product.downloadFile);

      await product.update({ downloadFile: null });
      res.json({ success: true, message: 'Download file deleted successfully.' });
    } catch (error) {
      logger.error(`Error deleting product download file:`, { productId: req.params.productId, error: error.message });
      res.status(500).json({ success: false, message: 'Server error while deleting download file.' });
    }
  },

  // Definir mídia em destaque
  setFeaturedMedia: async (req, res) => {
    try {
      const { productId } = req.params;
      const { mediaPath } = req.body;

      const product = await Product.findByPk(productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

      const mediaExists = (product.mediaFiles || []).some(media => media.path === mediaPath);
      if (!mediaExists) return res.status(404).json({ success: false, message: 'Media not found in product.' });

      await product.update({ featuredMedia: mediaPath });
      res.json({ success: true, message: 'Featured media updated successfully.' });
    } catch (error) {
      logger.error(`Error setting featured media:`, { productId: req.params.productId, error: error.message });
      res.status(500).json({ success: false, message: 'Server error while setting featured media.' });
    }
  },

  // Deletar um produto
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      if (product.name === 'All Access Pass') {
        return res.status(403).json({ success: false, message: 'The "All Access Pass" product cannot be deleted.' });
      }

      (product.mediaFiles || []).forEach(media => deleteFile(media.path));
      if (product.downloadFile) deleteFile(product.downloadFile);

      await product.destroy();
      res.json({ success: true, message: 'Product deleted successfully.' });
    } catch (error) {
      logger.error(`Error deleting product ${req.params.id}:`, { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, message: 'Server error while deleting the product.' });
    }
  }
};

module.exports = adminProductController;
