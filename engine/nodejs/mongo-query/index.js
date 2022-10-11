const mongoose = require('mongoose');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const os = require('os');
const JSONStream = require('JSONStream')

const field = 'heapUsed';
const allocationStep = 100000 * 1024; // 10MB

const TIME_INTERVAL_IN_MSEC = 40;
//"--max-old-space-size=512"

const movieSchema = new mongoose.Schema({
    plot: String,
    runtime: Number,
    title: String,
    lastupdated: String,
    year: Number,
    imdb: {
        rating: Number,
        votes: Number,
        id: Number,
    },
    released: Date,
});

const movieModel = mongoose.model('movies', movieSchema);

const delay = (timeMilliseconds) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, timeMilliseconds);
     });
  }

  function handleSchedule({ startDate, endDate }) {
    let st = moment(startDate);
    const end = moment(endDate);
    console.log(
      `st: ${st} end: ${end} ${st.isBefore(end)}`
    )
    let scheduleTimes = []
    while (st.isBefore(end)) {
      const timeStart = moment(st);
      const timeEnd = moment(st).add(10, 'year')
      st = timeEnd >= end ? end : timeEnd
      scheduleTimes.push({
        startDate: timeStart,
        endDate: st
      })
    }
    return scheduleTimes
  }
  
  const findPolicy = async ({ startDate, endDate }) => {
    const result = await movieModel.find({ startDate, endDate})
    return result
  }
  const findPolicyV2 = async ({ startDate, endDate }) => {
    let result = []
    let i = 0
    const cursor = await movieModel.find().select('title year imdb.id').lean().cursor({})
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        result[i] = doc
        i++
      }
    return result
  }
  
async function handleQueryPolicies(scheduleTimes) {
  const schedule = [...scheduleTimes]

  let numElts = schedule.length 
 
// number of elements to process in a single chunk 
const chunkSize = 1
 
// what we want to do to each element in elts 
 
let chunks = [] // holds our processing chunks 
 
// used to print current chunk number 
let count = 0 
 
while (numElts) { 
  let chunk = schedule.splice(0, chunkSize) // grab a chunk 
 
  console.log(`processing chunk ${++count}`)
  const resFromCh = await Promise.all( // returns an array of promises 
  chunk.map(elt => { // convert each elt to a Promise 
    console.log(`processing elt: ${elt}`) 
    return new Promise((resolve, reject) => { 
      try { 
        return resolve(findPolicyV2({ startDate: elt.startDate, endDate: elt.endDate})) 
      } catch (err) { 
        return reject(err) 
      } 
    }) 
  }) 
) 
 
  chunks.push(resFromCh)
  numElts = schedule.length // update number of elts left to process 
} 
const res = await Promise.all(chunks)
return res
    // let i =  0
    // let res = []
    // while(i < scheduleTimes.length) {
    //   const { startDate, endDate } = scheduleTimes[i]
    //   console.log(`scheduleTimes ${i + 1}`)
    //   console.log(`startDate ${i + 1}: ${startDate.toISOString()}, ${startDate.format('YYYY-MM-DD h:mm A')}`)
    //   console.log(`endDate ${i + 1}: ${endDate.toISOString()}, ${endDate.format('YYYY-MM-DD h:mm A')}`)
    //   const result = await movieModel.find({ $and:[ { released: { $gte: startDate } }, { released: { $lte: endDate } }] })
    //   console.log(`scheduleTimes ${i + 1} total: ${result.length}`)
    //   await delay(5000)
    //   res[i] = result
    //   i++
    // }
    // return res
  }

async function mainV1() {
    console.log('connecting to database')
    await mongoose.connect('mongodb://localhost:27017/sample_mflix');
    console.log('connecting to database successfully')
    const startDate = moment('1900-01-07T00:00:00.000+00:00')
    const endDate = moment()
    const res = await findPolicyV2({ startDate, endDate })
    console.log(res[0])
    console.log(res.length)
}
async function mainV2() {
    console.log('connecting to database')
    await mongoose.connect('mongodb://localhost:27017/sample_mflix');
    console.log('connecting to database successfully')
    const startDate = moment('1900-01-07T00:00:00.000+00:00')
    const endDate = moment()
    
    const scheduleTimes = handleSchedule({ startDate, endDate })
    console.log('scheduleTimes')
    console.log(scheduleTimes)
    const res = await handleQueryPolicies(scheduleTimes)
    console.log(res.length)

}

mainV1()

setInterval(() => {

  const mu = process.memoryUsage();
  // # bytes / KB / MB / GB
  const gbNow = mu[field] / 1024 / 1024 / 1024;
  const gbRounded = Math.round(gbNow * 100) / 100;

  console.log(`Heap allocated ${gbRounded} GB`);
}, TIME_INTERVAL_IN_MSEC);