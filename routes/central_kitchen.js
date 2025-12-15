
import { Router } from 'express';
import { getCenkitL1, getCenkitL1All, GetCenkitL1Daily, GetCenkitL1DailyByDate, GetCenkitL1Weekly, GetCenkitL1WeeklyByDate, getHourlyCenkitL1, getHourlyCenkitL1ByDate, getShift1CenkitL1, getShift2CenkitL1, getShift3CenkitL1 } from '../controllers/CentralKitchen1Controller.js';
import { getCenkitL2, getCenkitL2All, GetCenkitL2Daily, GetCenkitL2DailyByDate, GetCenkitL2Weekly, GetCenkitL2WeeklyByDate, getHourlyCenkitL2, getHourlyCenkitL2ByDate, getShift1CenkitL2, getShift2CenkitL2, getShift3CenkitL2 } from '../controllers/CentralKitchen2Controller.js';
import { format, getWeek, getWeekDates } from '../config/dateUtils.js';

const app = Router();

app.get('/cenkit_l1', getCenkitL1);
app.get('/cenkit_l1_all', getCenkitL1All);

app.get('/shift1_cenkit_l1', getShift1CenkitL1);
app.get('/shift2_cenkit_l1', getShift2CenkitL1);
app.get('/shift3_cenkit_l1', getShift3CenkitL1);

app.get('/cenkit_l1_hourly', getHourlyCenkitL1);
app.get('/cenkit_l1_hourly/date/:date', getHourlyCenkitL1ByDate);
app.get('/cenkit_l1_daily', GetCenkitL1Daily);
app.get('/cenkit_l1_daily/date/:date', GetCenkitL1DailyByDate);
app.get('/cenkit_l1_weekly', GetCenkitL1Weekly);
app.get('/cenkit_l1_weekly/date/:date', GetCenkitL1WeeklyByDate);
// ================= ==================
app.get('/util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    const result = await req.db.query(`SELECT * FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' ORDER BY id DESC LIMIT 1`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift1_util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam  FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await req.db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await req.db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/util_cenkit_all', async (req, res) => {
    const result = await req.db.query(`SELECT * FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/util_cenkit_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/util_cenkit_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/util_cenkit_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/util_cenkit_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/util_cenkit_weekly', async (req, res) => {
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, weeklofmonth)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    // console.log("Real Star Date" ,startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date" ,enddate)
    // console.log(datethis)
    const result = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam , realdatetime  FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/util_cenkit_weekly/date/:date', async (req, res) => {
    var datethis = req.params.date
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    // var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, datethis)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await req.db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam , realdatetime  FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
// ==== BASIC CENTRAL KITCHEN 2 ======
app.get('/cenkit_l2', getCenkitL2);
app.get('/cenkit_l2_all', getCenkitL2All);
app.get('/shift1_cenkit_l2', getShift1CenkitL2);
app.get('/shift2_cenkit_l2', getShift2CenkitL2);
app.get('/shift3_cenkit_l2', getShift3CenkitL2);
app.get('/cenkit_l2_hourly', getHourlyCenkitL2);
app.get('/cenkit_l2_hourly/date/:date', getHourlyCenkitL2ByDate);
app.get('/cenkit_l2_daily', GetCenkitL2Daily);
app.get('/cenkit_l2_daily/date/:date', GetCenkitL2DailyByDate);
app.get('/cenkit_l2_weekly', GetCenkitL2Weekly);
app.get('/cenkit_l2_weekly/date/:date', GetCenkitL2WeeklyByDate);

export default app;