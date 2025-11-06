import React, { createContext, useContext, useState, ReactNode } from "react";

type Article = {
  id: string;
  code: string;
  designation: string;
  quantite: number;
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

  // Ajouter un article au panier
  const addToCart = (article: Article) => {
    setCart((prev) => {
      const existing = prev.find((a) => a.id === article.id);

      if (existing) {
        // Si l'article est déjà dans le panier, on ajoute la quantité
        return prev.map((a) =>
          a.id === article.id
            ? { ...a, quantite: a.quantite + article.quantite }
            : a
        );
      }

      // Premier ajout → juste ajouter l'article
      return [...prev, article];
    });
  };

  // Supprimer un article
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((a) => a.id !== id));
  };

  // Mettre à jour la quantité d’un article
  const updateQuantity = (id: string, newQuantity: number) => {
    setCart((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, quantite: newQuantity } : a
      )
    );
  };

  // Vider le panier
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook pour utiliser le panier
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
