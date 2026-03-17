// import { title } from "process";
import { UserRole } from "@prisma/client";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Modern e-commerce platform";

function withProtocol(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
}

export function getBaseUrl() {
  const configuredUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL;
  const vercelUrl = withProtocol(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_BRANCH_URL ||
      process.env.VERCEL_URL,
  );

  if (process.env.NODE_ENV === "production" && vercelUrl) {
    return vercelUrl;
  }

  return withProtocol(configuredUrl) || vercelUrl || "http://localhost:3000";
}

export const SERVER_URL = getBaseUrl();
export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
  email: "",
  password: "",
};

export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export const shippingAddressDefultValues = {
  fullName: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(", ")
  : ["PayPal", "Stripe", "CashOnDelivery"];
export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || "PayPal";

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 6;
export const APP_SIDEBAR_WIDTH_CLASS = "w-72";

export const productDefualtValues = {
  name: "",
  slug: "",
  category: "",
  images: [],
  brand: "",
  description: "",
  price: 0,
  stock: 0,
  rating: 0,
  numReviews: "0",
  isFeatured: false,
  banner: null,
};

export const USER_ROLES: UserRole[] = Object.values(UserRole);

export const reviewForDefaultValues = {
  title: "",
  comment: "",
  rating: 0,
};
