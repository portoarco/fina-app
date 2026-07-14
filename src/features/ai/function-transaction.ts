import { CATEGORIES } from "@/constants/transaction-constant";
import { FunctionDeclaration, Type } from "@google/genai";

const transactionProperties = {
  id: {
    type: Type.STRING,
    description: "The unique identifier of the transaction",
  },
  amount: {
    type: Type.NUMBER,
    description: "The amount of the transaction",
  },
  description: {
    type: Type.STRING,
    description:
      "A brief description of the transaction. first letter must be capitalized",
  },
  type: {
    type: Type.STRING,
    enum: ["income", "expense"],
    description: "Type of the transactions, either 'income' or 'expense'",
  },
  category: {
    type: Type.STRING,
    enum: CATEGORIES,
    description: "Category of the transaction",
  },
  date: {
    type: Type.STRING,
    description: 'Date of the transaction in format "YYYY-MM-DD"',
  },
};

export const getTransactionDeclaration: FunctionDeclaration = {
  name: "get_transaction",
  description: "Get all transactions from the user's financial history.",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
  },
};

export const createTransactionDeclaration: FunctionDeclaration = {
  name: "create_transaction", //format boleh snake_case atau camelCase
  description:
    "Create a new transaction in the user's financial history based on the provided details",
  // description tugasnya supaya model bisa tahu kapan fungsi ini dipanggil
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties, // properties samakan dengan schema
    required: ["amount", "description", "type", "category", "date"], //utk id pada create tidak wajib
  },
  //   parameters berupa json object schema
};

export const deleteTransactionDeclaration: FunctionDeclaration = {
  name: "delete_transaction",
  description:
    "Delete an existing transaction from user's financial history based on the provided data",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
  },
};

export const updateTransactionDeclaration: FunctionDeclaration = {
  name: "update_transaction",
  description:
    "Update an existing transactions from user's financial history based on the provided data",
  parameters: {
    type: Type.OBJECT,
    properties: transactionProperties,
  },
};
