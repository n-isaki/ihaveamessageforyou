import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { db } from "../firebase";

const ORDERS_COL = "etsy_orders";
const CUSTOMERS_COL = "etsy_customers";
const SUMMARIES_COL = "etsy_summaries";

// ─── Orders ───────────────────────────────────────────────

export const getOrders = async () => {
  const q = query(collection(db, ORDERS_COL), orderBy("orderDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getOrderById = async (id) => {
  const snap = await getDoc(doc(db, ORDERS_COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getOrdersByCustomerId = async (customerId) => {
  const q = query(
    collection(db, ORDERS_COL),
    where("customerId", "==", customerId),
    orderBy("orderDate", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateOrder = async (id, data) => {
  await updateDoc(doc(db, ORDERS_COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ─── Customers ────────────────────────────────────────────

export const getCustomers = async () => {
  const q = query(
    collection(db, CUSTOMERS_COL),
    orderBy("lastOrderAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getCustomerById = async (id) => {
  const snap = await getDoc(doc(db, CUSTOMERS_COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ─── Summaries ────────────────────────────────────────────

export const getSummary = async (periodKey) => {
  const snap = await getDoc(doc(db, SUMMARIES_COL, periodKey));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllSummaries = async (type = "monthly") => {
  const q = query(
    collection(db, SUMMARIES_COL),
    where("type", "==", type),
    orderBy("periodKey", "desc"),
    limit(24),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Etsy Sync (Cloud Functions) ──────────────────────────

export const syncEtsyOrdersNow = async () => {
  const functions = getFunctions(undefined, "europe-west1");
  const fn = httpsCallable(functions, "etsySyncOrdersNow");
  const result = await fn({});
  return result.data;
};

export const debugEtsyReceipts = async (limitCount = 3) => {
  const functions = getFunctions(undefined, "europe-west1");
  const fn = httpsCallable(functions, "etsyDebugReceipts");
  const result = await fn({ limit: limitCount });
  return result.data;
};

export const exportOrdersCSV = async (from, to) => {
  const functions = getFunctions(undefined, "europe-west1");
  const fn = httpsCallable(functions, "exportOrdersCSV");
  const result = await fn({ from, to });
  return result.data;
};

// ─── CSV Client-Side Export Fallback ──────────────────────

export const buildCSVFromOrders = (orders) => {
  const headers = [
    "Datum",
    "Etsy Receipt-ID",
    "Kunde",
    "E-Mail",
    "Brutto (EUR)",
    "Versand (EUR)",
    "Etsy-Gebuehren (EUR)",
    "Zahlungsgebuehren (EUR)",
    "Marketing/Ads (EUR)",
    "Gebuehren Gesamt (EUR)",
    "Auszahlung (EUR)",
    "Kosten (EUR)",
    "Profit (EUR)",
    "Gewerbeart",
    "Status",
  ];

  const rows = orders.map((o) => {
    const d = o.orderDate?.seconds
      ? new Date(o.orderDate.seconds * 1000)
      : o.orderDate?._seconds
        ? new Date(o.orderDate._seconds * 1000)
        : null;
    const dateStr = d ? d.toLocaleDateString("de-DE") : "";
    const a = o.amounts || {};
    return [
      dateStr,
      o.platformOrderId || "",
      o.customerName || "",
      o.customerEmail || "",
      (a.gross ?? 0).toFixed(2),
      (a.shipping ?? 0).toFixed(2),
      (a.platformFee ?? 0).toFixed(2),
      (a.processingFee ?? 0).toFixed(2),
      (a.marketingFee ?? 0).toFixed(2),
      (a.totalFees ?? 0).toFixed(2),
      (a.payout ?? 0).toFixed(2),
      (o.costs ?? 0).toFixed(2),
      (o.profit ?? 0).toFixed(2),
      o.businessType || "mini",
      o.status || "",
    ];
  });

  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(";"),
    ...rows.map((r) => r.map(escape).join(";")),
  ].join("\n");
  return csv;
};

export const downloadCSV = (csv, filename = "kamlimos-export.csv") => {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
