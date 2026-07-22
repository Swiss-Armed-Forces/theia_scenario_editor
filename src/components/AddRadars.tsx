import { Button } from "@mui/material";

export default function AddRadars() {
  return (
    <fieldset className="addRadars" >
      <legend>Add sensors</legend>
      <Button variant="contained">Active radar</Button>
      <Button variant="contained">PCL</Button>
    </fieldset>
  );
}
