interface StarFieldProps {
  count?: number;
  bright?: boolean;
}

function seededValue(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export default function StarField({ count = 40, bright = false }: StarFieldProps) {
  const opacityBase = bright ? 0.2 : 0.15;
  const opacityRange = bright ? 0.6 : 0.4;

  return (
    <div className="star-field" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const sizeSeed = seededValue(index, 6);
        const size = sizeSeed > 0.9 ? 3 : sizeSeed > 0.7 ? 2 : 1;
        return (
          <div
            key={index}
            className="star"
            style={{
              left: `${seededValue(index, 1) * 100}%`,
              top: `${seededValue(index, 2) * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${seededValue(index, 3) * 3}s`,
              animationDuration: `${2 + seededValue(index, 4) * 3}s`,
              opacity: opacityBase + seededValue(index, 5) * opacityRange,
            }}
          />
        );
      })}
    </div>
  );
}
