import Image from "next/image";
import LoginLogoutButton from "@/components/login-logout-button";
import UserGreetText from "@/components/user-greet-text";

export default function Home() {
  return (
    <main className="flex flex-col gap-8 items-center justify-center w-full h-[100vh]">
      <UserGreetText />
      <LoginLogoutButton />
    </main>
  );
}
