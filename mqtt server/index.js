import { connect } from 'mqtt';
import { createConnection } from 'mysql2';
import { formattedTime } from "./formatdate.js";
import { exec } from 'child_process';
import fs from 'fs'
import { error, log } from 'console';
import { stderr, stdout } from 'process';
import { differenceInHours, parseISO, parse } from 'date-fns';



// Kết nối tới MQTT broker
const mqttClient = connect('mqtt://broker.emqx.io');
const mqttTopic = "Hust/htn/test/esp"

// Kết nối tới MySQL database
const mysqlConnection = createConnection({
  host: 'localhost',
  user: 'root',
  password: '11111111',
  database: 'parking'
});
// khởi chạy mqttt, sub topic
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker!');
  mqttClient.subscribe(mqttTopic, (err) => {
    if (err) {
      console.log(err);
    }
  });
});
// function push message 
async function pushMessage(topic, message) {
    mqttClient.publish(topic, message, (err) => {
    if (err) {
        console.error('Gửi tin nhắn thất bại', err);
    } else {
        console.log(`Đã gửi tin nhắn "${message}" lên chủ đề "${topic}"`);
    }


});
}

//random id theo timestamp
function generateRandomId() {
  const timestamp = new Date().getTime();
  const randomValue = Math.floor(Math.random() * 1000);
  const output = `${timestamp}${randomValue}`
  return output;
}



// define path python prog
const pythonProgram = 'E:\\Smart_parking\\Server\\recognition_license_plate\\read_plate.py';
    // define Runscript
    const RunScript = () => {
      return new Promise((resolve,reject)=> {
        exec(`python3 ${pythonProgram}`, (error, stdout, stderr) => {
          if(error) {
            console.error(`Error executing Python script: ${error}`);
            reject(error);
          } else {
            console.log(`Python script output: ${stdout}`);
            resolve(stdout);
          }
        });
      });
    };

// query lấy money
function getMoneyValue(id) {
  return new Promise((resolve, reject) => {
    const selectMoneyQuery = `SELECT Money FROM card WHERE ID = '${id}'`;

    mysqlConnection.query(selectMoneyQuery, (err, results) => {
      if (err) {
        console.error('Error selecting Money data:', err);
        reject(err);
      } else {
        if (results.length > 0) {
          const moneyValue = results[0].Money;
          console.log(`Money for ID '${id}': ${moneyValue}`);
          resolve(moneyValue);
        } else {
          console.log('No matching record found.');
          resolve(null);
        }
      }
    });
  });
}

// query check thẻ 
const checkCardStatus = (idt) => {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM card WHERE ID = '${idt}'`;

    mysqlConnection.query(selectQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length > 0 && results[0].isCheckin === 1) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
};
// query select checkout => ra time 
function getLatestCheckInTime(id) {
  return new Promise((resolve, reject) => {
    // Truy vấn để lấy giá trị CheckInTime từ bảng history cho mỗi IdCard
    const query = `
      SELECT TimeCheckIn
      FROM (
        SELECT TimeCheckIn, ROW_NUMBER() OVER (PARTITION BY IdCard ORDER BY id DESC) as row_num
        FROM history
        WHERE IdCard = '${id}'
      ) AS ranked
      WHERE row_num = 1
    `;

    mysqlConnection.query(query, (err, results) => {
      if (err) {
        console.error(`Error querying CheckInTime: ${err}`);
        reject(err);
        return;
      }

      if (results.length > 0) {
        // Lấy giá trị CheckInTime từ kết quả truy vấn
        const checkInTime = parseISO(results[0].TimeCheckIn);
        resolve(checkInTime);
      } else {
        console.log('No CheckInTime found for the given IdCard');
        resolve(null);
      }
    });
  });
}

//query lấy reg plate 
function getRegPlateById(id) {
  return new Promise((resolve, reject) => {
    const selectRegPlateQuery = `
      SELECT RegPlate
      FROM history
      WHERE IdCard = '${id}'
      ORDER BY id DESC
      LIMIT 1;
    `;

    mysqlConnection.query(selectRegPlateQuery, (err, results) => {
      if (err) {
        console.error('Error selecting data:', err);
        reject(err);
      } else {
        if (results.length > 0) {
          const regPlate = results[0].RegPlate;
          console.log(`RegPlate for IdCard '${id}': ${regPlate}`);
          resolve(regPlate);
        } else {
          console.log('No matching record found.');
          resolve(null);
        }
      }
    });
  });
}

// query xem có tồn tại id không 
//Kiểm tra ID trong cơ sở dữ liệu MySQL
const ValidID = async (idt) => {
  const selectQuery = `SELECT * FROM card WHERE ID = '${idt}'`;

  try {
    const results = await new Promise((resolve, reject) => {
      mysqlConnection.query(selectQuery, (err, results) => {
        if (err) {
          // console.log("the khong hop le!");
          // pushMessage("Hust/htn/test", "0");

          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    if (results.length > 0) {
      console.log("the hop le!");
      // gui messgae ve esp

      return true;
    } else {
      console.log("the khong hop le!");
          pushMessage("Hust/htn/test", "0");

      return false;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};


//lắng nghe message từ topic Bắt đầu :()
mqttClient.on('message', async (topic, message) => {
  const data = message.toString().trim();
  // const data = JSON.parse(message.toString());
  const idt = data
  // const id = data.ID;
  const id = idt;
  // let isValid = 1;
  // if (!checkIDValidity()){
  //   console.log("khone the vao");
  // }
  console.log(id);
  const isValid = await ValidID(id);
  // ValidID(id)
  //   .then(() => {
  //     isValid = 1;
  //     console.log("pass step 1");
      

  //     // mqttClient.publish("Hust/htn/test", responseMessage);
  //   })
  //   .catch((err) => {
  //     isValid = 0;
  //     console.log("pass step 1");
  //     console.error('card undefine:', err);
  //     mqttClient.publish("Hust/htn/test", "the an cap");

  //   })


  
  

  // Làm thêm 1 trường is Checkin. Check nếu isCheckin là true thì thực hiện query gửi xe, nếu checkout thì thực hiện query check out
 
  if(topic === mqttTopic && isValid == true){
    // cần query xem cái id của thẻ có trong DB không. Có thì sẽ check field IsCheckin. Nếu isCheckin = false thì mới thực hiện check in
    // try để check status và bắt lỗi
    try {
      const isCheckin = await checkCardStatus(id);

      if (isCheckin) { // da check in
        
         // Thực hiện hàm log ra thành công tại đây
        console.log('Card is checked in. Checking out ....');
        
        // neu da checkin thi thuc hien checkout
        RunScript()
          .then(async (output) => {
            const txtOutput  = "E:\\mqtt server\\output.txt";
            const outputData = fs.readFileSync(txtOutput, 'utf-8');

            // valid bien so neu dung bien thi moi update bang. ko dung thi ko lam gì
            
            getRegPlateById(id)
              .then(async regPlate => {
                if (regPlate !== null) {
                  if(regPlate == outputData){
                    // ĐẾN CHỖ NÀY THÌ ĐÃ XONG PHẦN LOGIC KIỂM TRA BIỂN SỐ, SẼ GỬI LUÔN CHO ESP MESSAGE MỞ BARIE
                    console.log("Checking...");
                        // lấy checkin time
                    const CheckInTime = await getLatestCheckInTime(id);
                    console.log(CheckInTime);
                    // const currentTime = formattedTime;  
                    // lấy tg hiện tại
                    const currentTimeParsed = parseISO(formattedTime, 'yyyy-MM-dd HH:mm:ss', new Date());
                    console.log(currentTimeParsed);
                    // lấy tg chênh lệch
                    const hoursDifference = differenceInHours(currentTimeParsed, CheckInTime);
                    console.log(hoursDifference);
                    if(true) {
                      // update bảng history
                      const cash = (hoursDifference == 0) ? 10000 : hoursDifference* 1000;
                      const updateHistoryQuery = `UPDATE history SET TimeCheckOut = '${formattedTime}', Cash = ${cash} WHERE IdCard = '${id}' AND TimeCheckOut IS NULL`;

                      mysqlConnection.query(updateHistoryQuery, (err, result) => {
                        if (err) {
                          console.error('Error updating data in history table:', err);
                        } else {
                          if (result.affectedRows > 0) {
                            console.log('Data updated in history table successfully.');
                            // Thực hiện các hành động khác nếu cần
                          } else {
                            console.log('No matching record found to update.');
                          }
                        }
                      });

                      //update bảng card
                      const currentMoney = await getMoneyValue(id);
                      console.log("currentMoney:" + currentMoney);
                      console.log("cash:" + cash);
                      const updateCardQuery = `UPDATE card SET IsCheckIn = 0, Money = ${currentMoney-cash} WHERE ID = '${id}'`;

                      mysqlConnection.query(updateCardQuery, (err, result) => {
                        if (err) {
                          console.error('Error updating data in card table:', err);
                        } else {
                          if (result.affectedRows > 0) {
                            console.log('Data updated in card table successfully.');
                            // Thực hiện các hành động khác nếu cần
                          } else {
                            console.log('No matching record found to update.');
                          }
                        }
                      });
                    }
                      // tra ve la xe checkout thanh cong
                      pushMessage("Hust/htn/test", "5");
                      console.log("Vehical: " + regPlate + " checkout Sucessfully!")
                  }
                  else{
                    // tra ve cho esp la bien so ko khop
                    pushMessage("Hust/htn/test", "2");
                    console.log("checkout fail!");
                    console.log("registration plate no matching");
                  }
                } else {
                  console.log('No matching record found.');
                }
              })
              .catch(error => {
                console.error('Error:', error);
              });
            
            
            
            


          })
          .catch((error)=> {
            console.error(`Error-Script-146: ${error}`);
          })
          console.log(' PLEASE WAIT');
      } else { // chua check in
        // chua checkin thi thuc hien checkin
        // check tien trong tk xem co lon hon 20000 khong thi moi cho gui 
        const CurrentMoney = await getMoneyValue(id);
        if(CurrentMoney >= 20000){
           // chay runscript checkin
           RunScript()
           .then((output) => {
             const txtOutput  = "E:\\mqtt server\\output.txt";
             const outputData = fs.readFileSync(txtOutput, 'utf-8');
 
             console.log(`CHECKIN: ${outputData}`);
             
             // define update khi checkin

             const updateQueryCard = `UPDATE card SET isCheckin = 1 WHERE ID = '${id}'`; // update Card table
             mysqlConnection.query(updateQueryCard, (err, result) => {
               if (err) {
                 console.error('Error updating card status:', err);
               } else {
                 console.log('Card checked in successfully.');
                 // Thực hiện hàm log ra thành công tại đây và gửi về cho esp là đã thành công
               }
             });
 
             // update history table
             // Thêm dữ liệu vào bảng history
             
             const insertHistoryQuery = `INSERT INTO history (id, IdCard, TimeCheckIn, TimeCheckOut, RegPlate, Cash) VALUES (${generateRandomId()}, '${id}', '${formattedTime}', ${"null"}, '${outputData}', ${0})`;
 
             mysqlConnection.query(insertHistoryQuery, (err, result) => {
               if (err) {
                 console.error('Error inserting data into history table:', err);
               } else {
                 console.log('Data inserted into history table successfully.');
                 // Thực hiện hàm log ra thành công tại đây
               }
             });
             // GỬI DATA ĐÃ THÀNH CÔNG VỀ CHO CLIENT
              pushMessage("Hust/htn/test", "1")

 
 
             
           })
           .catch((error)=> {
             console.error(`Error-Script-61: ${error}`);
           })
           console.log(' PLEASE WAIT');
        } else {
          console.log("not enough money! try again...")
          // GỬI VỀ CHO CLIENT MESSAGE LÀ CHECK IN KHÔNG THÀNH CÔNG DO THIẾU MONEY
          pushMessage("Hust/htn/test", "3")

        }
        
      }
    } catch (error) {
      console.error('Error checking card status:', error);
    }

  }
  
});

// Xử lý sự kiện khi đóng kết nối
mqttClient.on('close', () => {
  console.log('Disconnected from MQTT broker');
});

// Xử lý sự kiện khi đóng kết nối với MySQL database
mysqlConnection.on('end', () => {
  console.log('Disconnected from MySQL database');
});
