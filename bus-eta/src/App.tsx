import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BusBoard from "@/pages/BusBoard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BusBoard />
    </QueryClientProvider>
  );
}
