import React, { createContext, useContext, useState, ReactNode } from "react";

type Article = {
  id: string;
  code: string;
  designation: string;
  quantite: number;
  prix: number;
  stock: number;
};

type CartContextType = {
  cart: Article[];
  addToCart: (article: Article) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, newQuantity: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Article[]>([]);

  const addToCart = (article: Article) => {
    setCart((prev) => {
      const existing = prev.find((a) => a.id === article.id);

      if (existing) {
        const newQty = existing.quantite + article.quantite;

        if (newQty > article.stock) {
          // 🚨 On empêche de dépasser le stock
          alert(
            `Stock insuffisant. Max disponible : ${article.stock}. Déjà dans le panier : ${existing.quantite}`
          );
          return prev;
        }

        return prev.map((a) =>
          a.id === article.id ? { ...a, quantite: newQty } : a
        );
      }

      // Premier ajout → vérifier aussi
      if (article.quantite > article.stock) {
        alert(
          `Stock insuffisant. Max disponible : ${article.stock}`
        );
        return prev;
      }

      return [...prev, article];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((a) => a.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setCart((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, quantite: newQuantity } : a
      )
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
