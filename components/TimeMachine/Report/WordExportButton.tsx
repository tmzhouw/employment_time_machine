'use client';

import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

export function WordExportButton() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const reportElement = document.getElementById('report-content');
            if (!reportElement) {
                alert('未找到报告内容');
                return;
            }

            // Clone the report element to modify it for export without affecting the display
            const clone = reportElement.cloneNode(true) as HTMLElement;

            // Remove non-print elements from clone
            const noPrintElements = clone.querySelectorAll('.no-print');
            noPrintElements.forEach(el => el.remove());

            // Handle SVGs (Charts) - Convert to Images
            const originalSvgs = reportElement.querySelectorAll('svg');
            const clonedSvgs = clone.querySelectorAll('svg');

            // We need to iterate over original SVGs to capture their current state/style
            // and replace the cloned SVGs with the resulting images.
            for (let i = 0; i < originalSvgs.length; i++) {
                const originalSvg = originalSvgs[i];
                const clonedSvg = clonedSvgs[i];

                if (!originalSvg || !clonedSvg) continue;

                // Create a canvas to draw the SVG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const svgData = new XMLSerializer().serializeToString(originalSvg);

                // Get dimensions
                const { width, height } = originalSvg.getBoundingClientRect();

                // Scale up for better quality
                const scale = 2;
                canvas.width = width * scale;
                canvas.height = height * scale;

                // SVG Image
                const img = new Image();
                // Create Blob from SVG data
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        if (ctx) {
                            ctx.fillStyle = 'white'; // White background for charts
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        }
                        resolve(null);
                    };
                    img.onerror = reject;
                    img.src = url;
                });

                // Convert canvas to png data URL
                const pngData = canvas.toDataURL('image/png');

                // Create img element to replace svg in clone
                const imgElement = document.createElement('img');
                imgElement.src = pngData;
                imgElement.width = width; // Display width
                imgElement.style.maxWidth = '100%';

                // Replace SVG in clone
                clonedSvg.parentNode?.replaceChild(imgElement, clonedSvg);

                URL.revokeObjectURL(url);
            }

            // Construct Word HTML
            // Add basic styles for Word
            const styles = `
                <style>
                    body { font-family: 'SimSun', '宋体', serif; font-size: 12pt; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    h1 { font-size: 24pt; text-align: center; font-weight: bold; margin-bottom: 20px; }
                    h2 { font-size: 18pt; font-weight: bold; margin-top: 20px; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 5px; }
                    h3 { font-size: 14pt; font-weight: bold; margin-top: 15px; margin-bottom: 10px; color: #2c5282; }
                    p { text-indent: 2em; line-height: 1.5; margin-bottom: 10px; }
                    .text-center { text-align: center; text-indent: 0; }
                    .text-right { text-align: right; }
                    /* Highlight colors */
                    .text-red-600 { color: red; }
                    .text-emerald-600 { color: green; }
                </style>
            `;

            const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <title>Report</title>
                    ${styles}
                </head>
                <body>
                    ${clone.innerHTML}
                </body>
                </html>
            `;

            // Create Blob
            const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });

            // Trigger Download
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `天门市就业报告_${new Date().toISOString().split('T')[0]}.doc`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

        } catch (error) {
            console.error('Export failed:', error);
            alert('导出Word失败，请重试');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="fixed bottom-24 right-8 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50 no-print flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
            title="导出Word"
            aria-label="Export to Word"
        >
            {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 font-medium">
                {isExporting ? '导出中...' : '导出Word'}
            </span>
        </button>
    );
}
