import Sequelize from "sequelize";
const sequelize = new Sequelize(
  'parking',
  'root',
  '11111111',
  {
    host: 'localhost',
    dialect: 'mysql'
  }
);

// Sự kiện authenticate sẽ được gọi khi kết nối thành công
sequelize.authenticate()
  .then(() => {
    console.log('Kết nối cơ sở dữ liệu thành công');
  })
  .catch(err => {
    console.error('Kết nối cơ sở dữ liệu thất bại:', err);
  });

export default sequelize;
