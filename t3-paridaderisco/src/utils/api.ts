import { type AppRouter } from "~/server/api/root";

// Simplified API types for now - client setup can be added later
export type RouterInputs = {
  auth: {
    register: {
      name: string;
      email: string;
      phone: string;
      password: string;
    };
    login: {
      email: string;
      password: string;
    };
  };
};

export type RouterOutputs = {
  auth: {
    register: {
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        createdAt: Date;
      };
      token: string;
    };
    login: {
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        createdAt: Date;
      };
      token: string;
    };
  };
};

// Export router type
export type { AppRouter };