const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // Để phục vụ file tĩnh

const app = express();
app.use(express.json());
app.set('view engine', 'ejs'); // Đặt EJS làm view engine
app.set('views', path.join(__dirname, 'views')); // Đặt thư mục views
app.use('/image', express.static(path.join(__dirname, 'image')));

// Kết nối MongoDB
mongoose.connect('mongodb+srv://quocmai:toan1102003@mangcambiencuoiki.khi35.mongodb.net/Cambien', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Error connecting to MongoDB", err));

// Định nghĩa Schema và Model
const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now },
});

const SensorData = mongoose.model('Espcambien', sensorSchema);

// Endpoint nhận dữ liệu từ ESP32
app.post('/api/sensors', async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    const newSensorData = new SensorData({ temperature, humidity });
    await newSensorData.save();
    res.status(201).send("Data saved successfully");
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint lấy dữ liệu cảm biến mới nhất
app.get('/api/sensors', async (req, res) => {
  try {
    // Lấy 10 bản ghi mới nhất
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(10);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    const latestData = await SensorData.findOne().sort({ timestamp: -1 });
    res.json({
      temperature: latestData?.temperature || 'N/A',
      humidity: latestData?.humidity || 'N/A',
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route cho weather
app.get('/weather', async (req, res) => {
  try {
    const latestData = await SensorData.findOne().sort({ timestamp: -1 });
    res.render('weather', {
      temperature: latestData?.temperature || 'N/A',
      humidity: latestData?.humidity || 'N/A',
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error loading weather data");
  }
});

// Route Dashboard
app.get('/dashboard', async (req, res) => {
  try {
    // Trả về giao diện dashboard
    res.render('dashboard');
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
});

// Phục vụ giao diện web (index.html) từ thư mục gốc
app.get('/databoard', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Trỏ trực tiếp đến index.html
});

app.get('/', (req, res) => {
  res.send("This is the root route, it won't serve index.html anymore.");
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
