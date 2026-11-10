<?php
//Template
use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$app_name = env('APP_NAME', '');

Route::prefix($app_name)->group(function () {

  // Logout and its supporting checks must not sit behind AuthMiddleware —
  // they read the token directly via their own resolver and don't need a
  // fully validated session. Gating them behind AuthMiddleware let it
  // intercept and redirect away before the actual logout logic ever ran.
  Route::get("/logout", [AuthenticationController::class, 'logout'])->name('logout');
  Route::get("/session/siblings", [AuthenticationController::class, 'siblings'])->name('session.siblings');
    Route::get("/session/list", [AuthenticationController::class, 'sessions'])->name('session.list');

  Route::get("/unauthorized", function () {
    return Inertia::render('Unauthorized');
  })->name(name: 'unauthorized');
});
