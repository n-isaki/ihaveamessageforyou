import React from "react";
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div>
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles, Heart } from "lucide-react";

export default function BraceletExperience({ gift, getFontSizeClass }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-center space-y-8 max-w-4xl"
                >
                    <div className="inline-block mb-4">
                        <Sparkles className="h-6 w-6 text-indigo-400 mx-auto animate-pulse" />
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl italic font-serif tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-stone-400">
                        "{gift.engravingText || ""}"
                    </h1>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-12 left-0 right-0 flex justify-center"
                >
                    <div className="flex flex-col items-center text-stone-500 text-xs tracking-[0.2em] uppercase animate-bounce">
                        <span className="mb-2">Die Bedeutung</span>
                        <div className="w-px h-8 bg-gradient-to-b from-stone-500 to-transparent"></div>
                    </div>
                </motion.div>
            </div>

            {/* Content Section */}
            <div className="min-h-[80vh] bg-stone-900 flex flex-col items-center justify-center p-8 md:p-16">
                <div className="max-w-2xl w-full space-y-8 mb-auto mt-auto">
                    <div className="h-px w-24 bg-indigo-500 mb-8 opacity-50"></div>

                    {/* MARKDOWN CONTENT */}
                    <div
                        className={`prose prose-invert prose-stone max-w-none ${getFontSizeClass()}`}
                    >
                        <ReactMarkdown
                            components={{
                                p: ({ ...props }) => (
                                    <p
                                        className="mb-6 leading-loose text-stone-300 font-light"
                                        {...props}
                                    />
                                ),
                                strong: ({ ...props }) => (
                                    <strong className="font-semibold text-white" {...props} />
                                ),
                                h1: ({ ...props }) => (
                                    <h1
                                        className="text-3xl font-serif text-white mt-8 mb-4"
                                        {...props}
                                    />
                                ),
                                h2: ({ ...props }) => (
                                    <h2
                                        className="text-2xl font-serif text-stone-200 mt-8 mb-4 border-b border-stone-800 pb-2"
                                        {...props}
                                    />
                                ),
                                h3: ({ ...props }) => (
                                    <h3
                                        className="text-xl font-serif text-stone-200 mt-6 mb-3"
                                        {...props}
                                    />
                                ),
                                ul: ({ ...props }) => (
                                    <ul
                                        className="list-disc pl-6 mb-6 space-y-2 text-stone-300"
                                        {...props}
                                    />
                                ),
                                li: ({ ...props }) => <li className="pl-2" {...props} />,
                                blockquote: ({ ...props }) => (
                                    <blockquote
                                        className="border-l-4 border-indigo-500 pl-4 py-1 italic text-stone-400 my-6 bg-stone-950/30 p-4 rounded-r-lg"
                                        {...props}
                                    />
                                ),
                                a: ({ ...props }) => (
                                    <a
                                        className="text-indigo-400 hover:text-indigo-300 underline"
                                        {...props}
                                    />
                                ),
                            }}
                        >
                            {gift.meaningText || ""}
                        </ReactMarkdown>
                    </div>

                    <div className="flex justify-end mt-12">
                        <Heart className="h-5 w-5 text-indigo-500 fill-current opacity-50" />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-20 text-center opacity-30 hover:opacity-100 transition-opacity pb-20">
                    <a
                        href="https://www.kamlimos.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs uppercase tracking-[0.2em] font-light hover:text-white transition-colors"
                    >
                        www.kamlimos.com
                    </a>
                </div>
            </div>
        </div>
    );
}
