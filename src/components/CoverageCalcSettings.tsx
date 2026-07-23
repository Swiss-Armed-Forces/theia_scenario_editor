import { useGuiStateStore } from "../context/GuiStateStore";

export default function CoverageCalcSettings() {
  const conf = useGuiStateStore((state) => state.monostaticCoverageCalcConf);
  const updateConf = useGuiStateStore(
    (state) => state.updateMonostaticCoverageCalcConf,
  );

  return (
    <fieldset className="SettingsContainer">
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
        value={conf.targetRcs}
        maxLength={3}
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
      <label htmlFor="aziRes">Azimuth res. [deg]</label>
      <input
        name="azuRes"
        type="number"
        value={conf.azimuthResolution}
        onChange={(e) => {
          updateConf({
            ...conf,
            azimuthResolution: parseFloat(e.target.value),
          });
        }}
      />
    </fieldset>
  );
}
