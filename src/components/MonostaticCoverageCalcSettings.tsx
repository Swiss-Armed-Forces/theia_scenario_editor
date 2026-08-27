import { Button } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";

export default function MonostaticCoverageCalcSettings() {
  const conf = useGuiStateStore((state) => state.monostaticCoverageCalcConf);
  const updateConf = useGuiStateStore(
    (state) => state.updateMonostaticCoverageCalcConf,
  );
  const resetConf = useGuiStateStore(
    (state) => state.resetMonostaticCoverageCalcConf,
  );

  return (
    <fieldset className="MonostaticCoverageSettingsContainer">
      <legend>Coverage calc settings</legend>
      <label htmlFor="targetAlt">Target MASL</label>
      <input
        name="targetAlt"
        value={conf.targetAlt}
        maxLength={5}
        onChange={(e) => {
          updateConf({ ...conf, targetAlt: parseFloat(e.target.value) });
        }}
      />
      <label htmlFor="targetRcs">Target RCS [m^2]</label>
      <input
        name="targetRcs"
        type="number"
        value={conf.targetRcs}
        maxLength={5}
        onChange={(e) => {
          updateConf({ ...conf, targetRcs: parseFloat(e.target.value) });
        }}
      />
      <label htmlFor="probThreshold">Desired Detection Prob.</label>
      <input
        name="probThreshold"
        type="number"
        value={conf.probabilityThreshold}
        onChange={(e) => {
          updateConf({
            ...conf,
            probabilityThreshold: parseFloat(e.target.value),
          });
        }}
      />
      <label htmlFor="latRes">Lat res. [deg]</label>
      <input
        name="latRes"
        type="number"
        value={conf.latRes}
        onChange={(e) => {
          updateConf({
            ...conf,
            latRes: parseFloat(e.target.value),
          });
        }}
      />
      <label htmlFor="lonRes">Lon res. [deg]</label>
      <input
        name="lonRes"
        type="number"
        value={conf.lonRes}
        onChange={(e) => {
          updateConf({
            ...conf,
            lonRes: parseFloat(e.target.value),
          });
        }}
      />
      <Button variant="outlined" onClick={() => resetConf()}>
        Reset to default
      </Button>
    </fieldset>
  );
}
