import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import AssignedJobsScreen from "../screens/AssignedJobsScreen";
import JobDetailsScreen from "../screens/JobDetailsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import DocumentsScreen from "../screens/DocumentsScreen";
import HelpSupportScreen from "../screens/HelpSupportScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import ScanParcelScreen from "../screens/ScanParcelScreen";
import PrintLabelsScreen from "../screens/PrintLabelsScreen";
import CashReconciliationScreen from "../screens/CashReconciliationScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

const Stack = createNativeStackNavigator();

export default function DriverStack() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AssignedJobs" component={AssignedJobsScreen} />
          <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="ScanParcelScreen" component={ScanParcelScreen} />
          <Stack.Screen name="PrintLabelsScreen" component={PrintLabelsScreen} />
          <Stack.Screen name="CashReconciliation" component={CashReconciliationScreen} />
          <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
