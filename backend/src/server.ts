import express = require('express');
import cors = require('cors');
import * as dotenv from 'dotenv';
import { testDbConnection } from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes'; // 👈 NEW
import supplierRoutes from './routes/supplierRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import customerRoutes from './routes/customerRoutes';
import saleRoutes from './routes/saleRoutes';
import outgoingDeliveryRoutes from './routes/outgoingDeliveryRoutes';
import paymentRoutes from './routes/paymentRoutes';
import expenseRoutes from './routes/expenseRoutes';
import reportRoutes from './routes/reportRoutes';
import employeeRoutes from './routes/employeeRoutes';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile Wholesale App backend is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // 👈 NEW
// Add this line
app.use('/api/suppliers', supplierRoutes);
// Add this line
app.use('/api/purchases', purchaseRoutes);
// Add this line
app.use('/api/customers', customerRoutes);
// Add this line
app.use('/api/sales', saleRoutes);
// Add this line
app.use('/api/outgoing-deliveries', outgoingDeliveryRoutes);
// Add this line
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
// Add this line
app.use('/api/reports', reportRoutes);
app.use('/api/employees', employeeRoutes);


async function startServer() {
  try {
    await testDbConnection();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT} and on network`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}

startServer();


