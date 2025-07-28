import {
  users,
  clients,
  products,
  categories,
  invoices,
  invoiceItems,
  sales,
  type User,
  type UpsertUser,
  type Client,
  type Product,
  type Category,
  type Invoice,
  type InvoiceItem,
  type Sale,
  type InsertClient,
  type InsertProduct,
  type InsertCategory,
  type InsertInvoice,
  type InsertInvoiceItem,
  type InsertSale,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, count, sql, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createLocalUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, profileData: Partial<User>): Promise<User>;
  updateUserSettings(id: string, settings: { currency?: string; language?: string }): Promise<User>;
  
  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client>;
  deleteClient(id: number, userId: string): Promise<void>;
  searchClients(userId: string, query: string): Promise<Client[]>;
  
  // Product operations
  getProducts(userId: string): Promise<Product[]>;
  getProduct(id: number, userId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>, userId: string): Promise<Product>;
  deleteProduct(id: number, userId: string): Promise<void>;
  searchProducts(userId: string, query: string): Promise<Product[]>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: number, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>, userId: string): Promise<Category>;
  deleteCategory(id: number, userId: string): Promise<void>;
  
  // Invoice operations
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: number, userId: string): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: number, userId: string): Promise<(Invoice & { items: InvoiceItem[]; client: Client }) | undefined>;
  createInvoice(invoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoiceId'>[]): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, userId: string): Promise<Invoice>;
  deleteInvoice(id: number, userId: string): Promise<void>;
  
  // Sales operations
  getSales(userId: string): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  
  // Dashboard statistics
  getDashboardStats(userId: string): Promise<{
    revenue: number;
    invoiceCount: number;
    clientCount: number;
    productCount: number;
    recentInvoices: (Invoice & { client: Client })[];
    topProducts: (Product & { salesCount: number })[];
    lowStockProducts: Product[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createLocalUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserProfile(id: string, profileData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSettings(id: string, settings: { currency?: string; language?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number, userId: string): Promise<void> {
    await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
  }

  async searchClients(userId: string, query: string): Promise<Client[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return db.select().from(clients)
      .where(and(
        eq(clients.userId, userId),
        or(
          like(sql`LOWER(${clients.name})`, searchTerm),
          like(sql`LOWER(${clients.email})`, searchTerm),
          like(sql`LOWER(${clients.company})`, searchTerm)
        )
      ))
      .orderBy(desc(clients.createdAt))
      .limit(10);
  }

  // Product operations
  async getProducts(userId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number, userId: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.userId, userId)));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>, userId: string): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number, userId: string): Promise<void> {
    await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
  }

  async searchProducts(userId: string, query: string): Promise<Product[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return db.select().from(products)
      .where(and(
        eq(products.userId, userId),
        or(
          like(sql`LOWER(${products.name})`, searchTerm),
          like(sql`LOWER(${products.description})`, searchTerm)
        )
      ))
      .orderBy(desc(products.createdAt))
      .limit(10);
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(desc(categories.createdAt));
  }

  async getCategory(id: number, userId: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>, userId: string): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number, userId: string): Promise<void> {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  }

  // Invoice operations
  async getInvoices(userId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number, userId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return invoice;
  }

  async getInvoiceWithItems(id: number, userId: string): Promise<(Invoice & { items: InvoiceItem[]; client: Client }) | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

    if (!invoice) return undefined;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

    return {
      ...invoice.invoices,
      items,
      client: invoice.clients!,
    };
  }

  async createInvoice(invoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoiceId'>[]): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoiceId: newInvoice.id,
      }));
      await db.insert(invoiceItems).values(itemsWithInvoiceId);

      // Update stock immediately after creating invoice
      await this.updateStockAfterInvoiceCreation(itemsWithInvoiceId, invoice.userId);
    }

    return newInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>, userId: string): Promise<Invoice> {
    // Get the current invoice before updating
    const currentInvoice = await this.getInvoice(id, userId);
    
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    // If the status changed to 'payee' (or old 'paid'), create sales records
    if ((invoice.status === 'payee' || invoice.status === 'paid') && 
        currentInvoice?.status !== 'payee' && currentInvoice?.status !== 'paid') {
      await this.createSalesFromInvoice(id, userId);
    }

    return updatedInvoice;
  }

  // Helper function to update stock after invoice creation
  private async updateStockAfterInvoiceCreation(items: InsertInvoiceItem[], userId: string): Promise<void> {
    // Update stock for each product (prevent negative stock)
    for (const item of items.filter(item => item.productId)) {
      await db
        .update(products)
        .set({
          stock: sql`GREATEST(0, ${products.stock} - ${item.quantity})`
        })
        .where(and(
          eq(products.id, item.productId!),
          eq(products.userId, userId)
        ));
    }
  }

  // Helper function to create sales from invoice items
  private async createSalesFromInvoice(invoiceId: number, userId: string): Promise<void> {
    // Get invoice items
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    
    // Create sales records for each item and update stock
    const salesData = items
      .filter(item => item.productId) // Only create sales for items with productId
      .map(item => ({
        invoiceId: invoiceId,
        productId: item.productId!,
        quantity: item.quantity,
        unitPrice: item.priceHT,
        total: item.totalHT,
        userId: userId,
      }));

    if (salesData.length > 0) {
      // Insert sales records
      await db.insert(sales).values(salesData);
      
      // Update stock for each product (prevent negative stock)
      for (const item of items.filter(item => item.productId)) {
        await db
          .update(products)
          .set({
            stock: sql`GREATEST(0, ${products.stock} - ${item.quantity})`
          })
          .where(and(
            eq(products.id, item.productId!),
            eq(products.userId, userId)
          ));
      }
    }
  }

  async deleteInvoice(id: number, userId: string): Promise<void> {
    // First delete sales records associated with this invoice
    await db.delete(sales).where(eq(sales.invoiceId, id));
    // Then delete invoice items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    // Finally delete the invoice
    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  }

  // Sales operations
  async getSales(userId: string): Promise<Sale[]> {
    return db.select().from(sales).where(eq(sales.userId, userId)).orderBy(desc(sales.createdAt));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    return newSale;
  }

  // Dashboard statistics
  async getDashboardStats(userId: string): Promise<{
    revenue: number;
    invoiceCount: number;
    clientCount: number;
    productCount: number;
    recentInvoices: (Invoice & { client: Client })[];
    topProducts: (Product & { salesCount: number })[];
    lowStockProducts: Product[];
  }> {
    // Revenue (sum of all paid invoices)
    const revenueResult = await db
      .select({ total: sum(invoices.totalTTC) })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "payee")));
    
    const revenue = parseFloat(revenueResult[0]?.total || "0");

    // Invoice count
    const invoiceCountResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.userId, userId));
    
    const invoiceCount = invoiceCountResult[0]?.count || 0;

    // Client count
    const clientCountResult = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.userId, userId));
    
    const clientCount = clientCountResult[0]?.count || 0;

    // Product count
    const productCountResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.userId, userId));
    
    const productCount = productCountResult[0]?.count || 0;

    // Recent invoices with client info
    const recentInvoices = await db
      .select()
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(5);

    const recentInvoicesFormatted = recentInvoices.map(row => ({
      ...row.invoices,
      client: row.clients!,
    }));

    // Top products by sales count
    const topProductsResult = await db
      .select({
        product: products,
        salesCount: count(sales.id),
      })
      .from(products)
      .leftJoin(sales, eq(products.id, sales.productId))
      .where(eq(products.userId, userId))
      .groupBy(products.id)
      .orderBy(desc(count(sales.id)))
      .limit(5);

    const topProducts = topProductsResult.map(row => ({
      ...row.product,
      salesCount: row.salesCount,
    }));

    // Low stock products (stock < 10)
    const lowStockProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.stock, 0)))
      .limit(10);

    return {
      revenue,
      invoiceCount,
      clientCount,
      productCount,
      recentInvoices: recentInvoicesFormatted,
      topProducts,
      lowStockProducts,
    };
  }
}

export const storage = new DatabaseStorage();
