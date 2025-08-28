'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'downloadFile', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Caminho do arquivo ZIP do produto para download'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'downloadFile');
  }
};