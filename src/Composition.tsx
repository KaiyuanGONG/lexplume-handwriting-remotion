import React, { createElement } from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import rawScene from "./data/vector-scene.json";
import skip from "./data/skip-control.json";

type Value = string | number | null;
type TreeNode = { id: number; tag: string; children: TreeNode[] };
type Pose = { matrix: number[]; opacity: number };
type VectorScene = {
  width: number;
  height: number;
  fps: number;
  frames: number;
  background: string;
  ink: string;
  layers: { name: string; tree: TreeNode[]; poses: Pose[] }[];
  nodes: Record<
    string,
    { props: Record<string, Value>; tracks: Record<string, Value[]> }
  >;
};
const scene = rawScene as VectorScene;
const numberPattern = /-?\d*\.?\d+(?:e[+-]?\d+)?/gi;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export type HandwritingProps = {
  backgroundColor: string;
  inkColor: string;
  durationSeconds: number;
  showSkip: boolean;
};

// SVG geometry stays editable; the data contains attributes and motion poses,
// never video frames or screenshots. Every pose is selected by Remotion's frame.
export function blendValue(a: Value, b: Value, amount: number): Value {
  if (a === b || amount === 0 || b === null) return a;
  if (a === null) return b;
  if (typeof a === "number" && typeof b === "number") {
    return interpolate(amount, [0, 1], [a, b], clamp);
  }
  if (typeof a === "string" && typeof b === "string") {
    const left = a.match(numberPattern);
    const right = b.match(numberPattern);
    if (
      left &&
      right &&
      left.length === right.length &&
      a.replace(numberPattern, "#") === b.replace(numberPattern, "#")
    ) {
      let index = 0;
      return a.replace(numberPattern, () =>
        String(
          interpolate(
            amount,
            [0, 1],
            [Number(left[index]), Number(right[index++])],
            clamp,
          ),
        ),
      );
    }
  }
  return amount < 1 ? a : b;
}

function attributeName(name: string): string {
  if (name === "class") return "className";
  if (name === "xlink:href") return "xlinkHref";
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function VectorNode({
  node,
  sourceFrame,
}: {
  node: TreeNode;
  sourceFrame: number;
}) {
  const index = Math.floor(sourceFrame);
  const next = Math.min(index + 1, scene.frames - 1);
  const fraction = sourceFrame - index;
  const definition = scene.nodes[node.id];
  const props: Record<string, unknown> = { key: node.id };
  for (const [name, value] of Object.entries(definition.props)) {
    if (name === "mask-type") props.style = { maskType: value };
    else props[attributeName(name)] = value;
  }
  for (const [name, values] of Object.entries(definition.tracks)) {
    const value = blendValue(values[index], values[next], fraction);
    if (name === "mask-type") props.style = { maskType: value };
    else props[attributeName(name)] = value;
  }
  return createElement(
    node.tag,
    props,
    ...node.children.map((child) => (
      <VectorNode key={child.id} node={child} sourceFrame={sourceFrame} />
    )),
  );
}

function VectorLayer({
  layer,
  sourceFrame,
}: {
  layer: VectorScene["layers"][number];
  sourceFrame: number;
}) {
  const index = Math.floor(sourceFrame);
  const next = Math.min(index + 1, scene.frames - 1);
  const fraction = sourceFrame - index;
  const pose = layer.poses[index];
  const following = layer.poses[next];
  const matrix = pose.matrix.map((value, i) =>
    interpolate(fraction, [0, 1], [value, following.matrix[i]], clamp),
  );
  return (
    <g
      transform={`matrix(${matrix.join(" ")})`}
      opacity={interpolate(
        fraction,
        [0, 1],
        [pose.opacity, following.opacity],
        clamp,
      )}
    >
      {layer.tree.map((node) => (
        <VectorNode key={node.id} node={node} sourceFrame={sourceFrame} />
      ))}
    </g>
  );
}

export const HandwritingAnimation: React.FC<HandwritingProps> = ({
  backgroundColor,
  inkColor,
  showSkip,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sourceFrame = interpolate(
    frame,
    [0, durationInFrames - 1],
    [0, scene.frames - 1],
    clamp,
  );
  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <Interactive.Div
        name="Handwriting and feather"
        style={{ position: "absolute", inset: 0 }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1920 1080"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: inkColor, overflow: "visible" }}
        >
          {scene.layers.map((layer) => (
            <VectorLayer
              key={layer.name}
              layer={layer}
              sourceFrame={sourceFrame}
            />
          ))}
        </svg>
      </Interactive.Div>
      {showSkip ? (
        <Interactive.Div
          name="Skip label"
          style={{
            position: "absolute",
            left: skip.x,
            top: skip.y,
            width: skip.width,
            height: skip.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(41, 37, 30, 0.09)",
            borderRadius: 999,
            color: "#77746d",
            fontSize: 13.95,
            fontFamily: "Arial, sans-serif",
          }}
        >
          跳过
        </Interactive.Div>
      ) : null}
    </AbsoluteFill>
  );
};
