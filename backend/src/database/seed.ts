import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { typeOrmConfig } from '../config/typeorm.config';
import { AdminRole } from '../admin/entities/admin-role.entity';
import { AdminUser } from '../admin/entities/admin-user.entity';
import { StockCategory } from '../stocks/entities/stock-category.entity';
import { Stock } from '../stocks/entities/stock.entity';

async function seed() {
  const dataSource = new DataSource(typeOrmConfig);
  await dataSource.initialize();

  console.log('🌱 Starting database seeding...');

  // Create Admin Role
  const roleRepo = dataSource.getRepository(AdminRole);
  let superAdminRole = await roleRepo.findOne({ where: { name: 'Super Admin' } });

  if (!superAdminRole) {
    superAdminRole = roleRepo.create({
      name: 'Super Admin',
      description: 'Full system access',
      is_super_admin: true,
      permissions: {
        users: true,
        stocks: true,
        kyc: true,
        transactions: true,
        reports: true,
        settings: true,
      },
    });
    await roleRepo.save(superAdminRole);
    console.log('✅ Super Admin role created');
  }

  // Create Admin User
  const adminRepo = dataSource.getRepository(AdminUser);
  const existingAdmin = await adminRepo.findOne({
    where: { email: process.env.SUPER_ADMIN_EMAIL || 'admin@stockbroker.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD || 'Admin123!',
      12,
    );

    const admin = adminRepo.create({
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@stockbroker.com',
      password_hash: hashedPassword,
      full_name: 'Super Admin',
      role_id: superAdminRole.id,
      is_active: true,
    });

    await adminRepo.save(admin);
    console.log('✅ Admin user created');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD || 'Admin123!'}`);
  }

  // Create Stock Categories
  const categoryRepo = dataSource.getRepository(StockCategory);
  const categories = [
    { name: 'Technology', slug: 'technology', description: 'Technology and software companies' },
    { name: 'Finance', slug: 'finance', description: 'Banks and financial services' },
    { name: 'Healthcare', slug: 'healthcare', description: 'Healthcare and pharmaceuticals' },
    { name: 'Energy', slug: 'energy', description: 'Oil, gas, and renewable energy' },
    { name: 'Consumer', slug: 'consumer', description: 'Consumer goods and retail' },
  ];

  for (const [index, cat] of categories.entries()) {
    const existing = await categoryRepo.findOne({ where: { slug: cat.slug } });
    if (!existing) {
      const category = categoryRepo.create({ ...cat, sort_order: index });
      await categoryRepo.save(category);
      console.log(`✅ Category created: ${cat.name}`);
    }
  }

  // Create Sample Stocks
  const stockRepo = dataSource.getRepository(Stock);
  const techCategory = await categoryRepo.findOne({ where: { slug: 'technology' } });
  const finCategory = await categoryRepo.findOne({ where: { slug: 'finance' } });

  const stocks = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      category_id: techCategory.id,
      description: 'Technology company',
      current_price: 178.50,
      opening_price: 177.00,
      high_price: 180.00,
      low_price: 176.50,
      previous_close: 177.00,
      volume: 52000000,
      market_cap: 2800000000000,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      category_id: techCategory.id,
      description: 'Technology company',
      current_price: 378.90,
      opening_price: 375.00,
      high_price: 380.00,
      low_price: 374.00,
      previous_close: 375.00,
      volume: 28000000,
      market_cap: 2850000000000,
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      category_id: techCategory.id,
      description: 'Technology company',
      current_price: 141.80,
      opening_price: 140.00,
      high_price: 142.50,
      low_price: 139.80,
      previous_close: 140.00,
      volume: 31000000,
      market_cap: 1800000000000,
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase & Co.',
      category_id: finCategory.id,
      description: 'Financial services',
      current_price: 153.20,
      opening_price: 152.00,
      high_price: 154.00,
      low_price: 151.50,
      previous_close: 152.00,
      volume: 12000000,
      market_cap: 445000000000,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      category_id: techCategory.id,
      description: 'Electric vehicles and clean energy',
      current_price: 242.50,
      opening_price: 240.00,
      high_price: 245.00,
      low_price: 238.00,
      previous_close: 240.00,
      volume: 95000000,
      market_cap: 770000000000,
    },
  ];

  for (const stockData of stocks) {
    const existing = await stockRepo.findOne({ where: { symbol: stockData.symbol } });
    if (!existing) {
      const stock = stockRepo.create({
        ...stockData,
        is_active: true,
        is_tradeable: true,
        last_updated: new Date(),
      });
      await stockRepo.save(stock);
      console.log(`✅ Stock created: ${stockData.symbol}`);
    }
  }

  console.log('🎉 Database seeding completed!');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
});
