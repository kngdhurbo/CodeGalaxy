"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import React from "react";

/**
 * MenuVertical Component
 * High-fidelity vertical navigation for the Red Noir Inspector.
 */
export const MenuVertical = ({
  menuItems = [],
  activeTab,
  onTabChange,
  color = "#ef233c",
  skew = -10,
}) => {
  return (
    <div className="flex w-fit flex-col gap-4 px-6 py-4">
      {menuItems.map((item, index) => (
        <motion.div
          key={`${item.id}-${index}`}
          className={`group/nav flex items-center gap-2 cursor-pointer ${
            activeTab === item.id ? 'text-[#ef233c]' : 'text-zinc-500 hover:text-zinc-200'
          }`}
          initial="initial"
          whileHover="hover"
          onClick={() => onTabChange(item.id)}
        >
          <motion.div
            variants={{
              initial: { x: "-100%", opacity: 0 },
              hover: { x: 0, opacity: 1 },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ArrowRight strokeWidth={3} className="size-6" />
          </motion.div>

          <motion.span
            variants={{
              initial: { x: -20 },
              hover: { x: 0, skewX: skew },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="font-bold text-2xl uppercase tracking-tighter font-manrope"
          >
            {item.label}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
};
