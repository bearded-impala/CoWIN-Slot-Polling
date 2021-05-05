import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Grid, Header, Segment } from 'semantic-ui-react';
import Table from './components/Table';
let sessionTimer;

function CowinNotification() {
  const [availability, setAvailability] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('21');
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('363');
  const [selectedDate, setSelectedDate] = useState('2021-05-06');
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState('411017');
  const [minAge, setMinAge] = useState('18');
  const [type, setType] = useState('PIN');

  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else {
      Notification.requestPermission();
    }
    getStates();
  }, [])

  useEffect(() => {
    if (selectedState) {
      getDistricts();
    }
  }, [selectedState])

  const startPolling = () => {
    resetTimer();
    setLoading(true);
  }

  const stopPolling = () => {
    setLoading(false);
    clearInterval(sessionTimer);
    sessionTimer = null;
  }

  const resetTimer = () => {
    clearInterval(sessionTimer);
    sessionTimer = setInterval(isSessionAvailable, 10000);
  };

  const getStates = () => {
    axios.get('https://cdn-api.co-vin.in/api/v2/admin/location/states')
      .then((response) => {
        const stateList = response.data.states.map(arrayItem => ({
          key: arrayItem.state_name,
          value: arrayItem.state_id,
          text: arrayItem.state_name
        }));
        setStates(stateList);
      })
  }

  const getDistricts = () => {
    axios.get(`https://cdn-api.co-vin.in/api/v2/admin/location/districts/${selectedState}`)
      .then((response) => {
        const districtList = response.data.districts.map(arrayItem => ({
          key: arrayItem.district_name,
          value: arrayItem.district_id,
          text: arrayItem.district_name
        }));
        setDistricts(districtList);
      })
  }

  const handleStateChange = (e, { name, value }) => {
    setSelectedState(value)
  };

  const handleDistrictChange = (e, { name, value }) => {
    setSelectedDistrict(value)
  };

  const handleDateChange = (e, { name, value }) => {
    setSelectedDate(value)
  };

  const handlePinChange = (e, { name, value }) => {
    setPincode(value)
  };

  const handleTypeChange = (e, { name, value }) => {
    setType(value)
  };

  const handleMinAgeChange = (e, { name, value }) => {
    setMinAge(value)
  };

  setMinAge

  var data = [];
  const isSessionAvailable = () => {
    if (type === "PIN") {
      axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=${pincode}&date=${selectedDate}`)
      .then((response) => {
        data = [];
        response.data.sessions.forEach(function (arrayItem) {
          if (arrayItem.min_age_limit === minAge && arrayItem.vaccine === "COVISHIELD") {
            data.push({
              "pincode": arrayItem.pincode,
              "address": arrayItem.address,
              "fee_type": arrayItem.fee_type,
              "available_capacity": arrayItem.available_capacity,
              "lat": arrayItem.lat,
              "long": arrayItem.long
            })
          }
      });
      }).finally(() => {
        if (data.length > 0) {
          showNotification();
        }
        setAvailability(data)
        resetTimer()
      })   
    }
    if (type === "District") {
      axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${selectedDistrict}&date=${selectedDate}`)
      .then((response) => {
        data = [];
        response.data.sessions.forEach(function (arrayItem) {
          if (arrayItem.min_age_limit === minAge && arrayItem.vaccine === "COVISHIELD") {
            data.push({
              "pincode": arrayItem.pincode,
              "address": arrayItem.address,
              "fee_type": arrayItem.fee_type,
              "available_capacity": arrayItem.available_capacity,
              "lat": arrayItem.lat,
              "long": arrayItem.long
            })
          }
      });
      }).finally(() => {
        if (data.length > 0) {
          showNotification();
        }
        setAvailability(data)
        resetTimer()
      })
    }
  }

const showNotification = () => {
  var options = {
    body: "Hurry Up",
  };
  new Notification("Slot Available", options);
  }
  
  const columns = [
    { Header: 'pincode', accessor: 'pincode' },
    { Header: 'address', accessor: 'address', width: 400 },
    { Header: 'available', accessor: 'available_capacity' },
    { Header: 'lat', accessor: 'lat' },
    { Header: 'long', accessor: 'long' },
  ];

  return (
    <Segment>
      <Header size="huge">Co-WIN Slot Polling</Header>
      <Grid columns={2} divided>
      <Grid.Row>
      <Grid.Column>
      <Form>
        <Form.Group>
        <Form.Select
            label="State"
            name="selectedState"
            id="selectedState"
            options={states}
            value={selectedState}
            placeholder="Select State"
            onChange={handleStateChange}
            search
          />
          <Form.Select
            label="District"
            name="selectedDistrict"
            id="selectedDistrict"
            options={districts}
            value={selectedDistrict}
            placeholder="Select District"
            onChange={handleDistrictChange}
            search
          />
          <Form.Input
            type="date"
            label="Date"
            name="date"
            id="date"
            value={selectedDate}
            placeholder="Select Date"
            onChange={handleDateChange}
            required
          />
          <Form.Input
             name="pincode"
             label="PIN Code"
             id="pincode"
             value={pincode}
             onChange={handlePinChange}
                />
            <Form.Select
              name="minAge"
              label="MinAge"
              id="minAge"
              options={[{ key: "18", value: "18", text: "18" },
                    { key: "45", value: "45", text: "45" }]}
              onChange={handleMinAgeChange}
              value={minAge}
            />
          <Form.Select
              name="type"
              label="Poll By"
              id="type"
              options={[{ key: "District", value: "District", text: "District" },
                    { key: "PIN", value: "PIN", text: "PIN" }]}
              onChange={handleTypeChange}
              value={type}
            />
        </Form.Group>
        <Form.Group>
        <Form.Button
            content="Start"
            onClick={startPolling}
            loading={loading}
            disabled={sessionTimer}
            color="green"
            fluid
          />
          <Form.Button
            content="Stop"
            onClick={stopPolling}
            disabled={!sessionTimer}
            color="red"
            fluid
          />
          </Form.Group>
        </Form>
        </Grid.Column>
        </Grid.Row>
        </Grid>
      <Table columns={columns} data={availability} />
    </Segment>
  );
}

export default CowinNotification;