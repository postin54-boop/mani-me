import React, { useEffect, useState } from "react";
import { Box, Grid, Card, CardContent, Typography, Paper, Select, MenuItem, InputLabel, FormControl, List, ListItem, ListItemText, Chip, CircularProgress } from "@mui/material";
import api from "../api";

const WarehouseInventory = () => {
  const [summary, setSummary] = useState({ UK: 0, Ghana: 0 });
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [warehouse, setWarehouse] = useState("all");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/api/parcels/summary"),
      api.get("/api/parcels")
    ])
      .then(([summaryRes, parcelsRes]) => {
        setSummary(summaryRes.data);
        setParcels(parcelsRes.data);
        setError("");
      })
      .catch((err) => {
        setError("Failed to load warehouse data");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredParcels = parcels.filter((p) => {
    let match = true;
    if (warehouse !== "all") match = match && p.warehouseLocation === warehouse;
    if (filter !== "all") match = match && p.status === filter;
    return match;
  });

  return (
    <Box>
      <Typography variant="h5" mb={2}>Warehouse Inventory</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">UK Warehouse</Typography>
              <Typography variant="h4" color="primary">{summary.UK}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Ghana Warehouse</Typography>
              <Typography variant="h4" color="primary">{summary.Ghana}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Warehouse</InputLabel>
            <Select value={warehouse} label="Warehouse" onChange={e => setWarehouse(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="UK">UK</MenuItem>
              <MenuItem value="Ghana">Ghana</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filter} label="Status" onChange={e => setFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="in-stock">In Stock</MenuItem>
              <MenuItem value="in-transit">In Transit</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <List>
            {filteredParcels.map((p) => (
              <ListItem key={p.id} divider>
                <ListItemText
                  primary={`Parcel #${p.id}`}
                  secondary={`Warehouse: ${p.warehouseLocation} | Status: ${p.status} | Size: ${p.size || "-"}`}
                />
                <Chip label={p.status} color={p.status === "in-stock" ? "info" : p.status === "delivered" ? "success" : "default"} />
              </ListItem>
            ))}
            {filteredParcels.length === 0 && <Typography sx={{ p: 2 }}>No parcels found.</Typography>}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default WarehouseInventory;
