import { Router } from "express";
import { getControlLhp, updateControlLhp } from "../../../controllers/wafer/lhp/CtrController.js";
const app = Router();

app.get('/control_lhp/:grup', getControlLhp);
app.put('/control_lhp/:grup', updateControlLhp);

export default app;