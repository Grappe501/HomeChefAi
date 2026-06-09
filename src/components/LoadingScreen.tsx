export default function LoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stainless-100">
      <div className="w-10 h-10 rounded-xl border-2 border-steel border-t-chef animate-spin mb-6" />
      <h1 className="font-sans font-semibold text-xl text-chef tracking-tight">SousChef</h1>
      <p className="text-chef-subtle mt-2 text-sm">Preparing your kitchen…</p>
    </div>
  );
}
