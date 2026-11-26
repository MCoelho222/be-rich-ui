/** The user's photo, or their initial when they haven't uploaded one. */
import { initial } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = 32,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-semibold text-brand",
        className
      )}
    >
      {src ? (
        // A data URL from the API: next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : name ? (
        initial(name)
      ) : (
        ""
      )}
    </span>
  );
}
