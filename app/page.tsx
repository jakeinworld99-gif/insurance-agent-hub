import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Insurance Agent Hub</h1>
        <p className={styles.subtitle}>Scaffold ready. Full build gated behind KAN-44b.</p>
        <p className={styles.meta}>Next.js 14 App Router, deployed to Vercel.</p>
      </div>
    </main>
  );
}
