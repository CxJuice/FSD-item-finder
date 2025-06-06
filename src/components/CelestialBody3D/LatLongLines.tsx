import * as THREE from "three";

export default function LatLongLines({
  radius,
  latCount = 8,
  longCount = 16,
  color = "#808080",
}: {
  radius: number;
  latCount?: number;
  longCount?: number;
  color?: string;
}) {
  // Latitude lines (excluding poles)
  const latLines = [];
  for (let i = 1; i < latCount; i++) {
    const lat = (i * Math.PI) / latCount;
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= 64; j++) {
      const lon = (j * 2 * Math.PI) / 64;
      const x = radius * Math.sin(lat) * Math.cos(lon);
      const y = radius * Math.cos(lat);
      const z = radius * Math.sin(lat) * Math.sin(lon);
      points.push(new THREE.Vector3(x, y, z));
    }
    latLines.push(
      <line key={`lat-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={1} />
      </line>
    );
  }
  // Longitude lines
  const longLines = [];
  for (let i = 0; i < longCount; i++) {
    const lon = (i * 2 * Math.PI) / longCount;
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= 64; j++) {
      const lat = (j * Math.PI) / 64;
      const x = radius * Math.sin(lat) * Math.cos(lon);
      const y = radius * Math.cos(lat);
      const z = radius * Math.sin(lat) * Math.sin(lon);
      points.push(new THREE.Vector3(x, y, z));
    }
    longLines.push(
      <line key={`long-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={1} />
      </line>
    );
  }
  return (
    <>
      {latLines}
      {longLines}
    </>
  );
}
