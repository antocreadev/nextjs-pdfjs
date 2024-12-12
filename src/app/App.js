"use client";
import { useEffect, useRef, useState } from "react";

export default function Test() {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [numberPage, setNumberPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    (async function () {
      const pdfJS = await import("pdfjs-dist/build/pdf");
      pdfJS.GlobalWorkerOptions.workerSrc =
        window.location.origin + "/pdf.worker.min.mjs";

      const pdf = await pdfJS.getDocument("example.pdf").promise;
      if (!isCancelled) {
        setTotalPages(pdf.numPages);
      }

      const page = await pdf.getPage(numberPage);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = canvasRef.current;
      const canvasContext = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (renderTaskRef.current) {
        await renderTaskRef.current.promise;
      }

      const renderContext = { canvasContext, viewport };
      const renderTask = page.render(renderContext);

      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (error) {
        if (error.name === "RenderingCancelledException") {
          console.log("Rendering cancelled.");
        } else {
          console.error("Render error:", error);
        }
      }

      if (!isCancelled) {
        console.log("Rendering completed");
      }
    })();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [numberPage]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md"
          onClick={() => setNumberPage(numberPage + 1)}
          disabled={numberPage >= totalPages}
        >
          Avancer
        </button>
        <button
          className="bg-red-500 text-white p-2 rounded-md"
          onClick={() => setNumberPage(numberPage - 1)}
          disabled={numberPage <= 1}
        >
          Reculer
        </button>
        <span className="p-2">
          Page {numberPage} sur {totalPages}
        </span>
      </div>

      <canvas ref={canvasRef} style={{ height: "100vh" }} />
    </div>
  );
}
