import * as React from "react";
import Image from "next/image";

export default function EagleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <div className={props.className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Image
        src="/eagleonlywhite.svg"
        alt="Eagle Logo"
        fill
        style={{ objectFit: 'contain' }}
        className="filter brightness-0 invert"
      />
    </div>
  );
}
