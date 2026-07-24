import { useGuiStateStore } from "../context/GuiStateStore";

export default function MonostaticCoverageCalcSettings() {
  const conf = useGuiStateStore((state) => state.pclCoverageCalcConf);
  const updateConf = useGuiStateStore(
    (state) => state.updatePclCoverageCalcConf,
  );

  return (
    <fieldset className="MonostaticCoverageSettingsContainer">
      <legend>Coverage calc settings</legend>
      <label htmlFor="targetAlt">Target MASL</label>
      <input
        name="targetAlt"
        type="number"
        value={conf.grid.height_start}
        maxLength={5}
        onChange={(e) => {
          const alt = parseFloat(e.target.value);
          updateConf({
            ...conf,
            grid: { ...conf.grid, height_start: alt, height_stop: alt },
          });
        }}
      />
      <label htmlFor="gridMinLat">Grid min lat [°]</label>
      <input
        name="gridMinLat"
        type="number"
        step={conf.grid.lat_res}
        value={conf.grid.lat_start}
        maxLength={3}
        onChange={(e) => {
          updateConf({
            ...conf,
            grid: { ...conf.grid, lat_start: parseFloat(e.target.value) },
          });
        }}
      />
      <label htmlFor="gridminLon">Grid min lon [°]</label>
      <input
        name="gridMinLon"
        type="number"
        step={conf.grid.lon_res}
        value={conf.grid.lon_start}
        maxLength={3}
        onChange={(e) => {
          updateConf({
            ...conf,
            grid: { ...conf.grid, lon_start: parseFloat(e.target.value) },
          });
        }}
      />
      <label htmlFor="gridMaxLat">Grid max lat [°]</label>
      <input
        name="gridMaxLat"
        type="number"
        step={conf.grid.lat_res}
        value={conf.grid.lat_stop}
        maxLength={3}
        onChange={(e) => {
          updateConf({
            ...conf,
            grid: { ...conf.grid, lat_stop: parseFloat(e.target.value) },
          });
        }}
      />
      <label htmlFor="gridmaxLon">Grid max lon [°]</label>
      <input
        name="gridMaxLon"
        type="number"
        step={conf.grid.lon_res}
        value={conf.grid.lon_stop}
        maxLength={3}
        onChange={(e) => {
          updateConf({
            ...conf,
            grid: { ...conf.grid, lon_stop: parseFloat(e.target.value) },
          });
        }}
      />
      <label htmlFor="gridResLat">Grid res lat [°]</label>
      <input
        name="gridResLat"
        type="number"
        value={conf.grid.lat_res}
        maxLength={3}
        onChange={(e) => {
          updateConf({
            ...conf,
            grid: { ...conf.grid, lat_res: parseFloat(e.target.value) },
          });
        }}
      />
      <label htmlFor="gridResLat">Grid res lon [°]</label>
      <input
        name="gridResLon"
        type="number"
        value={conf.grid.lon_res}
        maxLength={3}
        onChange={(e) => {
          updateConf({
            ...conf,
            grid: { ...conf.grid, lon_res: parseFloat(e.target.value) },
          });
        }}
      />
      <label htmlFor="snrThreshold">SNR Threshold [dB]</label>
      <input
        name="snrThreshold"
        value={conf.snrThreshold}
        maxLength={3}
        onChange={(e) => {
          updateConf({ ...conf, snrThreshold: parseFloat(e.target.value) });
        }}
      />
      <label htmlFor="delayThreshold">Delay Threshold [us]</label>
      <input
        name="delayThreshold"
        value={conf.delayThreshold}
        maxLength={3}
        onChange={(e) => {
          updateConf({ ...conf, snrThreshold: parseFloat(e.target.value) });
        }}
      />
    </fieldset>
  );
}
