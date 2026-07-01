import { Svg, Path, Circle, Rect, Line } from "@react-pdf/renderer";
import { brand } from "./brand";

type IconProps = { size?: number; color?: string };

const STROKE = 1.7;
function stroke(color: string) {
  return {
    stroke: color,
    strokeWidth: STROKE,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}
function wrap(size: number, children: React.ReactNode) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {children}
    </Svg>
  );
}

export function IconUser({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Circle cx={12} cy={8} r={4} {...s} />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" {...s} />
    </>
  ));
}

export function IconPhone({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M5 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" {...s} />
  ));
}

export function IconIdCard({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Rect x={2.5} y={5} width={19} height={14} rx={2} {...s} />
      <Circle cx={8} cy={11} r={2.2} {...s} />
      <Path d="M4.6 16c.5-1.9 2-2.6 3.4-2.6s2.9.7 3.4 2.6" {...s} />
      <Line x1={14} y1={10} x2={19} y2={10} {...s} />
      <Line x1={14} y1={13} x2={19} y2={13} {...s} />
    </>
  ));
}

export function IconFolder({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M3 6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" {...s} />
  ));
}

export function IconCalendar({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={2} {...s} />
      <Line x1={3.5} y1={9} x2={20.5} y2={9} {...s} />
      <Line x1={8} y1={3} x2={8} y2={6} {...s} />
      <Line x1={16} y1={3} x2={16} y2={6} {...s} />
    </>
  ));
}

export function IconCreditCard({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Rect x={2.5} y={5} width={19} height={14} rx={2} {...s} />
      <Line x1={2.5} y1={9.5} x2={21.5} y2={9.5} {...s} />
    </>
  ));
}

export function IconChat({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" {...s} />
  ));
}

export function IconPin({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11z" {...s} />
      <Circle cx={12} cy={10} r={2.5} {...s} />
    </>
  ));
}

export function IconGlobe({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Circle cx={12} cy={12} r={9} {...s} />
      <Line x1={3} y1={12} x2={21} y2={12} {...s} />
      <Path d="M12 3c3 3.5 3 14.5 0 18c-3-3.5-3-14.5 0-18z" {...s} />
    </>
  ));
}

export function IconTooth({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M7 3C5 3 3.6 4.6 3.6 7c0 2 .8 3 1.2 5 .5 2.6.3 8 1.8 8 1.3 0 1-3 2.5-3s1.2 3 2.5 3c1.5 0 1.3-5.4 1.8-8 .4-2 1.2-3 1.2-5C15 4.6 13.5 3 11.5 3c-1.7 0-2.3 1-3.5 1S8.7 3 7 3z" {...s} />
  ));
}
