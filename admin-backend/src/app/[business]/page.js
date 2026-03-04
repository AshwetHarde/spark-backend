"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function BusinessLandingPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.business) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/business/${params.business}`);
        const result = await res.json();

        if (!result.success) {
          setError("Business not found.");
        } else if (!result.active) {
          setError("This plan has expired.");
        } else {
          setData(result);
          setResult(result);
        }
      } catch (err) {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.business]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-100"><p className="font-bold text-gray-500">Loading...</p></div>;

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900">Oops!</h1>
        <p className="mt-4 text-gray-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans sm:p-8">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div
          className="h-32 w-full"
          style={{ backgroundColor: data.themeColor || "#000000" }}
        ></div>
        
        <div className="-mt-16 flex flex-col items-center px-6 pb-10">
          {data.logo ? (
            <img
              src={data.logo}
              alt={data.name}
              className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-5xl font-extrabold text-gray-400 shadow-lg">
              {data.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h1 className="mt-5 text-3xl font-black text-gray-900">{data.name}</h1>
          
          <div className="mt-8 flex w-full flex-col space-y-4">
            {data.cards?.map((card) => (
              <a
                key={card.type}
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-2xl p-4 text-lg font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: data.themeColor || "#000000" }}
              >
                {card.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}