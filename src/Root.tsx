import "./index.css";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { HandwritingAnimation, type HandwritingProps } from "./Composition";
import scene from "./data/vector-scene.json";

const calculateMetadata: CalculateMetadataFunction<HandwritingProps> = ({
  props,
}) => ({
  durationInFrames: Math.max(2, Math.round(props.durationSeconds * 30)),
});

export const RemotionRoot = () => (
  <Composition
    id="HandwritingAnimation"
    component={HandwritingAnimation}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={101}
    calculateMetadata={calculateMetadata}
    defaultProps={{
      backgroundColor: scene.background,
      inkColor: scene.ink,
      durationSeconds: 3.3666666667,
      showSkip: true,
    }}
  />
);
