export default function LoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-chef-50 to-sage-50">
      <div className="text-6xl mb-4 animate-bounce">👨‍🍳</div>
      <h1 className="font-display text-2xl text-chef-700">HomeChef AI</h1>
      <p className="text-sage-500 mt-2">Warming up your kitchen...</p>
    </div>
  );
}
